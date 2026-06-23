package com.github.matthiasbalke.todo.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.web.webauthn.api.AuthenticatorAttestationResponse
import org.springframework.security.web.webauthn.api.PublicKeyCredential
import org.springframework.security.web.webauthn.management.ImmutablePublicKeyCredentialCreationOptionsRequest
import org.springframework.security.web.webauthn.management.ImmutableRelyingPartyRegistrationRequest
import org.springframework.security.web.webauthn.management.RelyingPartyPublicKey
import org.springframework.security.web.webauthn.management.WebAuthnRelyingPartyOperations
import org.springframework.security.web.webauthn.registration.HttpSessionPublicKeyCredentialCreationOptionsRepository
import org.springframework.security.web.webauthn.registration.PublicKeyCredentialCreationOptionsRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.Base64

@RestController
@RequestMapping("/api/auth/recovery")
class RecoveryController(
    private val recoveryService: PasskeyRecoveryService,
    private val rpOperations: WebAuthnRelyingPartyOperations,
    private val accountService: AccountService,
) {

    private val creationOptionsRepository: PublicKeyCredentialCreationOptionsRepository =
        HttpSessionPublicKeyCredentialCreationOptionsRepository()

    data class RecoveryInfoResponse(val email: String, val displayName: String, val expiresAt: Instant)
    data class RecoveryRegisterRequest(
        val credential: PublicKeyCredential<AuthenticatorAttestationResponse>,
        val label: String?,
    )
    data class RecoveryCompleteResponse(val success: Boolean)

    @ExceptionHandler(RecoveryLinkException::class)
    fun recoveryError(error: RecoveryLinkException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(error.status).body(ErrorResponse(error.code, error.message))

    @GetMapping("/{token}")
    fun info(@PathVariable token: String): RecoveryInfoResponse {
        val context = recoveryService.resolve(token)
        return RecoveryInfoResponse(context.user.email, context.user.displayName, context.token.expiresAt)
    }

    @PostMapping("/{token}/register-options")
    fun options(
        @PathVariable token: String,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<*> {
        val context = recoveryService.resolve(token)
        val options = rpOperations.createPublicKeyCredentialCreationOptions(
            ImmutablePublicKeyCredentialCreationOptionsRequest(
                UsernamePasswordAuthenticationToken.authenticated(context.user.email, null, emptyList())
            )
        )
        creationOptionsRepository.save(request, response, options)
        return ResponseEntity.ok(options)
    }

    @PostMapping("/{token}/register")
    fun register(
        @PathVariable token: String,
        @RequestBody body: RecoveryRegisterRequest,
        request: HttpServletRequest,
    ): ResponseEntity<*> {
        val savedOptions = creationOptionsRepository.load(request)
            ?: return ResponseEntity.badRequest()
                .body(ErrorResponse("SESSION_EXPIRED", "Session expired, please try again"))
        val context = recoveryService.resolve(token)
        val credentialRecord = rpOperations.registerCredential(
            ImmutableRelyingPartyRegistrationRequest(
                savedOptions,
                RelyingPartyPublicKey(body.credential, body.label ?: "Recovered passkey"),
            )
        )
        val credentialUserId = bytesToUuid(credentialRecord.userEntityUserId.bytes)
        if (credentialUserId != context.user.id) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse("RECOVERY_MISMATCH", "Recovery credential did not match the target account"))
        }
        val base64CredId = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(credentialRecord.credentialId.bytes)
        accountService.savePasskeyLabel(base64CredId, body.label)
        recoveryService.consume(token)
        request.getSession(false)?.invalidate()
        return ResponseEntity.ok(RecoveryCompleteResponse(success = true))
    }
}
