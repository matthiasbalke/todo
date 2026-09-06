package com.github.matthiasbalke.todo.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.web.webauthn.api.AuthenticatorAttestationResponse
import org.springframework.security.web.webauthn.api.Bytes
import org.springframework.security.web.webauthn.api.PublicKeyCredential
import org.springframework.security.web.webauthn.management.ImmutablePublicKeyCredentialCreationOptionsRequest
import org.springframework.security.web.webauthn.management.ImmutableRelyingPartyRegistrationRequest
import org.springframework.security.web.webauthn.management.RelyingPartyPublicKey
import org.springframework.security.web.webauthn.management.WebAuthnRelyingPartyOperations
import org.springframework.security.web.webauthn.registration.HttpSessionPublicKeyCredentialCreationOptionsRepository
import org.springframework.security.web.webauthn.registration.PublicKeyCredentialCreationOptionsRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.Base64

@RestController
@RequestMapping("/api/setup")
class SetupController(
    private val adminService: AdminService,
    private val userRepository: UserRepository,
    private val userCredentialRepository: org.springframework.security.web.webauthn.management.UserCredentialRepository,
    private val rpOperations: WebAuthnRelyingPartyOperations,
    private val accountService: AccountService,
    private val authSessionService: AuthSessionService,
    private val setupSecretService: SetupSecretService,
) {

    private val creationOptionsRepository: PublicKeyCredentialCreationOptionsRepository =
        HttpSessionPublicKeyCredentialCreationOptionsRepository()

    data class SetupStatusResponse(val setupRequired: Boolean)
    data class SetupOptionsRequest(val email: String, val displayName: String, val setupSecret: String?)
    data class SetupCompleteRequest(
        val credential: PublicKeyCredential<AuthenticatorAttestationResponse>,
        val label: String?,
        val setupSecret: String?,
    )

    @GetMapping
    fun status(): SetupStatusResponse {
        setupSecretService.ensureReadyForSetup()
        return SetupStatusResponse(adminService.setupRequired())
    }

    @PostMapping("/webauthn/register-options")
    fun options(
        @RequestBody body: SetupOptionsRequest,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<*> {
        if (!adminService.setupRequired()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse("SETUP_NOT_REQUIRED", "Setup is not required"))
        }
        if (!setupSecretService.isValid(body.setupSecret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse("SETUP_SECRET_INVALID", "Setup secret is invalid. Check the backend logs and try again."))
        }
        val trimmedEmail = body.email.trim()
        val existing = userRepository.findByEmailIdentity(trimmedEmail)
        if (existing != null) {
            val hasCredentials = userCredentialRepository.findByUserId(Bytes(uuidToBytes(existing.id))).isNotEmpty()
            if (hasCredentials) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ErrorResponse("EMAIL_ALREADY_REGISTERED", "This email address is already registered."))
            }
            userRepository.delete(existing)
        }
        val user = userRepository.save(User(email = trimmedEmail, displayName = body.displayName.trim()))
        val options = rpOperations.createPublicKeyCredentialCreationOptions(
            ImmutablePublicKeyCredentialCreationOptionsRequest(
                UsernamePasswordAuthenticationToken.authenticated(user.email, null, emptyList())
            )
        )
        creationOptionsRepository.save(request, response, options)
        return ResponseEntity.ok(options)
    }

    @PostMapping("/webauthn/register")
    fun complete(
        @RequestBody body: SetupCompleteRequest,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<*> {
        if (!adminService.setupRequired()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse("SETUP_NOT_REQUIRED", "Setup is not required"))
        }
        if (!setupSecretService.isValid(body.setupSecret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse("SETUP_SECRET_INVALID", "Setup secret is invalid. Check the backend logs and try again."))
        }
        val savedOptions = creationOptionsRepository.load(request)
            ?: return ResponseEntity.badRequest()
                .body(ErrorResponse("SESSION_EXPIRED", "Session expired, please try again"))
        val credentialRecord = try {
            rpOperations.registerCredential(
                ImmutableRelyingPartyRegistrationRequest(
                    savedOptions,
                    RelyingPartyPublicKey(body.credential, body.label ?: "Admin passkey"),
                )
            )
        } catch (e: Exception) {
            bytesToUuid(savedOptions.user.id.bytes)?.let { userRepository.deleteById(it) }
            throw e
        }
        val base64CredId = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(credentialRecord.credentialId.bytes)
        accountService.savePasskeyLabel(base64CredId, body.label)
        request.getSession(false)?.invalidate()
        val user = bytesToUuid(credentialRecord.userEntityUserId.bytes)
            ?.let { userRepository.findById(it).orElse(null) }
            ?: return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build<Any>()
        user.admin = true
        userRepository.save(user)
        setupSecretService.clear()
        return ResponseEntity.ok(authSessionService.issueTokens(user, response))
    }
}
