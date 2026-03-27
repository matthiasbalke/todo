package com.github.matthiasbalke.todo.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.web.webauthn.api.AuthenticatorAssertionResponse
import org.springframework.security.web.webauthn.api.AuthenticatorAttestationResponse
import org.springframework.security.web.webauthn.api.PublicKeyCredential
import org.springframework.security.web.webauthn.api.PublicKeyCredentialCreationOptions
import org.springframework.security.web.webauthn.api.PublicKeyCredentialRequestOptions
import org.springframework.security.web.webauthn.management.ImmutablePublicKeyCredentialCreationOptionsRequest
import org.springframework.security.web.webauthn.management.ImmutablePublicKeyCredentialRequestOptionsRequest
import org.springframework.security.web.webauthn.management.ImmutableRelyingPartyRegistrationRequest
import org.springframework.security.web.webauthn.management.RelyingPartyAuthenticationRequest
import org.springframework.security.web.webauthn.management.RelyingPartyPublicKey
import org.springframework.security.web.webauthn.management.WebAuthnRelyingPartyOperations
import org.springframework.security.web.webauthn.registration.HttpSessionPublicKeyCredentialCreationOptionsRepository
import org.springframework.security.web.webauthn.registration.PublicKeyCredentialCreationOptionsRepository
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val revokedTokenRepository: RevokedTokenRepository,
    private val jwtTokenService: JwtTokenService,
    private val rpOperations: WebAuthnRelyingPartyOperations,
    private val jwtProperties: JwtProperties,
) {

    private val creationOptionsRepository: PublicKeyCredentialCreationOptionsRepository =
        HttpSessionPublicKeyCredentialCreationOptionsRepository()

    private val requestOptionsRepository =
        org.springframework.security.web.webauthn.authentication.HttpSessionPublicKeyCredentialRequestOptionsRepository()

    // ─── DTOs ────────────────────────────────────────────────────────────────

    data class RegisterOptionsRequest(val email: String, val displayName: String)
    data class UserDto(val id: String, val email: String, val displayName: String)
    data class TokenResponse(val accessToken: String, val user: UserDto)

    // ─── Registration ────────────────────────────────────────────────────────

    @PostMapping("/webauthn/register-options")
    fun registerOptions(
        @RequestBody body: RegisterOptionsRequest,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<PublicKeyCredentialCreationOptions> {
        // Upsert user — create if new, return existing if already registered
        val user = userRepository.findByEmail(body.email)
            ?: userRepository.save(User(email = body.email, displayName = body.displayName))

        val options = rpOperations.createPublicKeyCredentialCreationOptions(
            ImmutablePublicKeyCredentialCreationOptionsRequest(
                UsernamePasswordAuthenticationToken.authenticated(user.email, null, emptyList())
            )
        )
        creationOptionsRepository.save(request, response, options)
        return ResponseEntity.ok(options)
    }

    @PostMapping("/webauthn/register")
    fun register(
        @RequestBody credential: PublicKeyCredential<AuthenticatorAttestationResponse>,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<TokenResponse> {
        val savedOptions = creationOptionsRepository.load(request)
            ?: return ResponseEntity.badRequest().build()

        val credentialRecord = rpOperations.registerCredential(
            ImmutableRelyingPartyRegistrationRequest(savedOptions, RelyingPartyPublicKey(credential, "Passkey"))
        )
        request.getSession(false)?.invalidate()

        val user = resolveUserFromUserHandle(credentialRecord.userEntityUserId.bytes)
            ?: return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()

        return issueTokens(user, response)
    }

    // ─── Authentication ──────────────────────────────────────────────────────

    @PostMapping("/webauthn/login-options")
    fun loginOptions(
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<PublicKeyCredentialRequestOptions> {
        // No email — discoverable credentials; browser shows credential picker.
        // Empty allowCredentials prevents email enumeration (security.md A07).
        val options = rpOperations.createCredentialRequestOptions(
            ImmutablePublicKeyCredentialRequestOptionsRequest(null)
        )
        requestOptionsRepository.save(request, response, options)
        return ResponseEntity.ok(options)
    }

    @PostMapping("/webauthn/login")
    fun login(
        @RequestBody credential: PublicKeyCredential<AuthenticatorAssertionResponse>,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<TokenResponse> {
        val savedOptions = requestOptionsRepository.load(request)
            ?: return ResponseEntity.badRequest().build()

        val auth = rpOperations.authenticate(
            RelyingPartyAuthenticationRequest(savedOptions, credential)
        )
        request.getSession(false)?.invalidate()

        val user = resolveUserFromUserHandle(auth.id.bytes)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        return issueTokens(user, response)
    }

    // ─── Token management ────────────────────────────────────────────────────

    @PostMapping("/refresh")
    fun refresh(
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<TokenResponse> {
        val rawToken = request.cookies?.find { it.name == "refreshToken" }?.value
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        val hash = jwtTokenService.hashToken(rawToken)
        val stored = refreshTokenRepository.findByTokenHash(hash)
        if (stored == null || stored.expiresAt.isBefore(Instant.now())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        }

        val user = userRepository.findById(stored.userId).orElse(null)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()

        // Rotate: delete old, insert new
        refreshTokenRepository.delete(stored)
        return issueTokens(user, response)
    }

    @PostMapping("/logout")
    fun logout(
        request: HttpServletRequest,
        response: HttpServletResponse,
        @AuthenticationPrincipal userId: UUID?,
    ): ResponseEntity<Void> {
        // Revoke the access token jti so it cannot be replayed after logout
        val bearer = request.getHeader("Authorization")?.removePrefix("Bearer ")
        if (bearer != null) {
            try {
                val claims = jwtTokenService.parseAccessToken(bearer)
                val jti = claims.id
                val exp = jwtTokenService.accessTokenExpiresAt(claims)
                if (jti != null) {
                    revokedTokenRepository.save(RevokedToken(jti = jti, expiresAt = exp))
                }
            } catch (_: Exception) {
                // Token already invalid — still proceed with logout
            }
        }

        // Delete the refresh token
        val rawRefresh = request.cookies?.find { it.name == "refreshToken" }?.value
        if (rawRefresh != null) {
            val hash = jwtTokenService.hashToken(rawRefresh)
            refreshTokenRepository.findByTokenHash(hash)?.let { refreshTokenRepository.delete(it) }
        }

        response.setHeader(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
        return ResponseEntity.noContent().build()
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private fun issueTokens(user: User, response: HttpServletResponse): ResponseEntity<TokenResponse> {
        val accessToken = jwtTokenService.generateAccessToken(user)
        val rawRefresh = jwtTokenService.generateRefreshToken()
        val hash = jwtTokenService.hashToken(rawRefresh)
        val expiresAt = Instant.now().plus(jwtProperties.refreshTokenTtl)

        refreshTokenRepository.save(
            RefreshToken(userId = user.id, tokenHash = hash, expiresAt = expiresAt)
        )
        response.setHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie(rawRefresh).toString())

        return ResponseEntity.ok(
            TokenResponse(
                accessToken = accessToken,
                user = UserDto(user.id.toString(), user.email, user.displayName),
            )
        )
    }

    private fun refreshTokenCookie(value: String): ResponseCookie =
        ResponseCookie.from("refreshToken", value)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/api/auth")
            .maxAge(jwtProperties.refreshTokenTtl)
            .build()

    private fun clearRefreshCookie(): ResponseCookie =
        ResponseCookie.from("refreshToken", "")
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/api/auth")
            .maxAge(0)
            .build()

    private fun resolveUserFromUserHandle(userHandle: ByteArray): User? {
        if (userHandle.size != 16) return null
        val buffer = java.nio.ByteBuffer.wrap(userHandle)
        val uuid = UUID(buffer.long, buffer.long)
        return userRepository.findById(uuid).orElse(null)
    }

}
