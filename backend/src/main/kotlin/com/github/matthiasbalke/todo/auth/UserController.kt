package com.github.matthiasbalke.todo.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.web.webauthn.api.AuthenticatorAttestationResponse
import org.springframework.security.web.webauthn.api.PublicKeyCredential
import org.springframework.security.web.webauthn.management.ImmutablePublicKeyCredentialCreationOptionsRequest
import org.springframework.security.web.webauthn.management.ImmutableRelyingPartyRegistrationRequest
import org.springframework.security.web.webauthn.management.RelyingPartyPublicKey
import org.springframework.security.web.webauthn.management.WebAuthnRelyingPartyOperations
import org.springframework.security.web.webauthn.registration.HttpSessionPublicKeyCredentialCreationOptionsRepository
import org.springframework.security.web.webauthn.registration.PublicKeyCredentialCreationOptionsRepository
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.time.Duration
import java.time.Instant
import java.util.Base64
import java.util.UUID

@RestController
@RequestMapping("/api/users/me")
class UserController(
    private val userRepository: UserRepository,
    private val accountService: AccountService,
    private val rpOperations: WebAuthnRelyingPartyOperations,
) {

    private val creationOptionsRepository: PublicKeyCredentialCreationOptionsRepository =
        HttpSessionPublicKeyCredentialCreationOptionsRepository()

    // ─── DTOs ────────────────────────────────────────────────────────────────

    data class UserProfileDto(val id: UUID, val email: String, val displayName: String)
    data class UpdateProfileRequest(val displayName: String, val email: String)
    data class PasskeyDto(val id: UUID, val label: String?, val createdAt: Instant)
    data class AddPasskeyRequest(val credential: PublicKeyCredential<AuthenticatorAttestationResponse>, val label: String?)
    data class ListNameDto(val id: UUID, val name: String)
    data class DeletionPreviewDto(val listsToDelete: List<ListNameDto>, val listsToLeave: List<ListNameDto>)
    data class ErrorResponse(val code: String, val message: String)

    // ─── Profile ─────────────────────────────────────────────────────────────

    @GetMapping
    fun getMe(@AuthenticationPrincipal userId: UUID): ResponseEntity<UserProfileDto> {
        val user = userRepository.findById(userId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        return ResponseEntity.ok(user.toDto())
    }

    @PutMapping
    fun updateMe(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody body: UpdateProfileRequest,
    ): ResponseEntity<*> {
        return try {
            val user = accountService.updateProfile(userId, body.displayName, body.email)
            ResponseEntity.ok(user.toDto())
        } catch (e: ResponseStatusException) {
            when (e.statusCode) {
                HttpStatus.CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ErrorResponse("EMAIL_IN_USE", e.reason ?: "Email is already in use"))
                else -> throw e
            }
        }
    }

    // ─── Passkeys ────────────────────────────────────────────────────────────

    @GetMapping("/passkeys")
    fun getPasskeys(@AuthenticationPrincipal userId: UUID): ResponseEntity<List<PasskeyDto>> {
        val passkeys = accountService.getPasskeys(userId).map { it.toDto() }
        return ResponseEntity.ok(passkeys)
    }

    @PostMapping("/passkeys/register-options")
    fun addPasskeyOptions(
        @AuthenticationPrincipal userId: UUID,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<*> {
        val user = userRepository.findById(userId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        val options = rpOperations.createPublicKeyCredentialCreationOptions(
            ImmutablePublicKeyCredentialCreationOptionsRequest(
                UsernamePasswordAuthenticationToken.authenticated(user.email, null, emptyList())
            )
        )
        creationOptionsRepository.save(request, response, options)
        return ResponseEntity.ok(options)
    }

    @PostMapping("/passkeys")
    fun addPasskey(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody body: AddPasskeyRequest,
        request: HttpServletRequest,
    ): ResponseEntity<*> {
        val savedOptions = creationOptionsRepository.load(request)
            ?: return ResponseEntity.badRequest().build<Any>()
        val credentialRecord = rpOperations.registerCredential(
            ImmutableRelyingPartyRegistrationRequest(savedOptions, RelyingPartyPublicKey(body.credential, "Passkey"))
        )
        request.getSession(false)?.invalidate()
        val base64CredId = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(credentialRecord.credentialId.bytes)
        val passkey = accountService.savePasskeyLabel(base64CredId, body.label)
        return ResponseEntity.status(HttpStatus.CREATED).body(passkey.toDto())
    }

    @DeleteMapping("/passkeys/{id}")
    fun removePasskey(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
    ): ResponseEntity<*> {
        return try {
            accountService.removePasskey(userId, id)
            ResponseEntity.noContent().build<Any>()
        } catch (e: ResponseStatusException) {
            when (e.statusCode) {
                HttpStatus.CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ErrorResponse("LAST_PASSKEY", "Cannot remove the last passkey"))
                else -> throw e
            }
        }
    }

    // ─── Account deletion ────────────────────────────────────────────────────

    @GetMapping("/deletion-preview")
    fun getDeletionPreview(@AuthenticationPrincipal userId: UUID): ResponseEntity<DeletionPreviewDto> {
        val preview = accountService.getDeletionPreview(userId)
        return ResponseEntity.ok(
            DeletionPreviewDto(
                listsToDelete = preview.listsToDelete.map { ListNameDto(it.id, it.name) },
                listsToLeave = preview.listsToLeave.map { ListNameDto(it.id, it.name) },
            )
        )
    }

    @DeleteMapping
    fun deleteAccount(
        @AuthenticationPrincipal userId: UUID,
        response: HttpServletResponse,
    ): ResponseEntity<Void> {
        accountService.deleteAccount(userId)
        response.setHeader(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
        return ResponseEntity.noContent().build()
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private fun User.toDto() = UserProfileDto(id, email, displayName)

    private fun WebAuthnCredential.toDto() = PasskeyDto(id, label, createdAt)

    private fun clearRefreshCookie(): ResponseCookie =
        ResponseCookie.from("refreshToken", "")
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/api/auth")
            .maxAge(Duration.ZERO)
            .build()
}
