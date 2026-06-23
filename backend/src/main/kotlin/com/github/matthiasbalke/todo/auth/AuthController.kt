package com.github.matthiasbalke.todo.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.web.webauthn.api.AuthenticatorAssertionResponse
import org.springframework.security.web.webauthn.api.AuthenticatorAttestationResponse
import org.springframework.security.web.webauthn.api.Bytes
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
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.Base64
import java.util.UUID

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val revokedTokenRepository: RevokedTokenRepository,
    private val jwtTokenService: JwtTokenService,
    private val rpOperations: WebAuthnRelyingPartyOperations,
    private val userCredentialRepository: org.springframework.security.web.webauthn.management.UserCredentialRepository,
    private val accountService: AccountService,
    private val appSettingsService: AppSettingsService,
    private val authSessionService: AuthSessionService,
) {

    private val creationOptionsRepository: PublicKeyCredentialCreationOptionsRepository =
        HttpSessionPublicKeyCredentialCreationOptionsRepository()

    private val requestOptionsRepository =
        org.springframework.security.web.webauthn.authentication.HttpSessionPublicKeyCredentialRequestOptionsRepository()

    data class RegisterOptionsRequest(val email: String, val displayName: String)
    data class RegisterRequest(
        val credential: PublicKeyCredential<AuthenticatorAttestationResponse>,
        val label: String?,
    )
    data class AuthConfigResponse(val registrationEnabled: Boolean)

    @GetMapping("/config")
    fun config() = AuthConfigResponse(appSettingsService.isRegistrationEnabled())

    @PostMapping("/webauthn/register-options")
    fun registerOptions(
        @RequestBody body: RegisterOptionsRequest,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<*> {
        if (!appSettingsService.isRegistrationEnabled()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse("REGISTRATION_DISABLED", "Registration is currently disabled"))
        }
        val existingUser = userRepository.findByEmail(body.email)
        if (existingUser != null) {
            val hasCredentials = userCredentialRepository
                .findByUserId(Bytes(uuidToBytes(existingUser.id)))
                .isNotEmpty()
            if (hasCredentials) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ErrorResponse("EMAIL_ALREADY_REGISTERED", "This email address is already registered."))
            }
            userRepository.delete(existingUser)
        }
        val user = userRepository.save(User(email = body.email, displayName = body.displayName))

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
        @RequestBody body: RegisterRequest,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<*> {
        if (!appSettingsService.isRegistrationEnabled()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse("REGISTRATION_DISABLED", "Registration is currently disabled"))
        }
        val savedOptions = creationOptionsRepository.load(request)
            ?: return ResponseEntity.badRequest().build<Any>()

        val credentialRecord = try {
            rpOperations.registerCredential(
                ImmutableRelyingPartyRegistrationRequest(
                    savedOptions,
                    RelyingPartyPublicKey(body.credential, body.label ?: "Passkey"),
                )
            )
        } catch (e: Exception) {
            resolveUserFromUserHandle(savedOptions.user.id.bytes)?.let { userRepository.delete(it) }
            throw e
        }
        val base64CredId = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(credentialRecord.credentialId.bytes)
        accountService.savePasskeyLabel(base64CredId, body.label)
        request.getSession(false)?.invalidate()

        val user = resolveUserFromUserHandle(credentialRecord.userEntityUserId.bytes)
            ?: return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build<Any>()
        if (user.blockedAt != null) return blockedResponse(response)

        return ResponseEntity.ok(authSessionService.issueTokens(user, response))
    }

    @PostMapping("/webauthn/login-options")
    fun loginOptions(
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<PublicKeyCredentialRequestOptions> {
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
    ): ResponseEntity<*> {
        val savedOptions = requestOptionsRepository.load(request)
            ?: return ResponseEntity.badRequest().build<Any>()

        if (userCredentialRepository.findByCredentialId(credential.rawId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse("PASSKEY_NOT_REGISTERED", "This passkey is not registered. Please create an account first."))
        }

        val auth = rpOperations.authenticate(
            RelyingPartyAuthenticationRequest(savedOptions, credential)
        )
        request.getSession(false)?.invalidate()

        val user = resolveUserFromUserHandle(auth.id.bytes)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build<Any>()
        if (user.blockedAt != null) return blockedResponse(response)

        return ResponseEntity.ok(authSessionService.issueTokens(user, response))
    }

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
        if (user.blockedAt != null) {
            refreshTokenRepository.delete(stored)
            authSessionService.clearRefreshCookie(response)
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }

        refreshTokenRepository.delete(stored)
        return ResponseEntity.ok(authSessionService.issueTokens(user, response))
    }

    @PostMapping("/logout")
    fun logout(
        request: HttpServletRequest,
        response: HttpServletResponse,
        @AuthenticationPrincipal userId: UUID?,
    ): ResponseEntity<Void> {
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
                // Token already invalid; logout should still clear refresh state.
            }
        }

        val rawRefresh = request.cookies?.find { it.name == "refreshToken" }?.value
        if (rawRefresh != null) {
            val hash = jwtTokenService.hashToken(rawRefresh)
            refreshTokenRepository.findByTokenHash(hash)?.let { refreshTokenRepository.delete(it) }
        }

        authSessionService.clearRefreshCookie(response)
        return ResponseEntity.noContent().build()
    }

    private fun blockedResponse(response: HttpServletResponse): ResponseEntity<ErrorResponse> {
        authSessionService.clearRefreshCookie(response)
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse("ACCOUNT_BLOCKED", "Account is blocked"))
    }

    private fun resolveUserFromUserHandle(userHandle: ByteArray): User? =
        bytesToUuid(userHandle)?.let { userRepository.findById(it).orElse(null) }
}
