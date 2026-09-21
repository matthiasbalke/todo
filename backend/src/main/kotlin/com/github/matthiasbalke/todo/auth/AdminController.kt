package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.email.EmailConfiguration
import com.github.matthiasbalke.todo.email.EmailConfigurationSource
import com.github.matthiasbalke.todo.email.EmailDeliveryResult
import com.github.matthiasbalke.todo.email.EmailDeliveryService
import com.github.matthiasbalke.todo.email.EmailEncryption
import com.github.matthiasbalke.todo.email.EmailSettingsService
import com.github.matthiasbalke.todo.email.EmailSettingsUpdate
import com.github.matthiasbalke.todo.email.InvalidEmailConfigurationException
import com.github.matthiasbalke.todo.email.PasswordAction
import jakarta.mail.internet.AddressException
import jakarta.mail.internet.InternetAddress
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@RestController
@RequestMapping("/api/admin")
class AdminController(
    private val adminService: AdminService,
    private val appSettingsService: AppSettingsService,
    private val userRepository: UserRepository,
    private val passkeyRecoveryService: PasskeyRecoveryService,
    private val webAuthnCredentialRepository: WebAuthnCredentialRepository,
    private val emailSettingsService: EmailSettingsService,
    private val emailDeliveryService: EmailDeliveryService,
) {

    data class RegistrationSettingResponse(val registrationEnabled: Boolean)
    data class UpdateRegistrationRequest(val registrationEnabled: Boolean)
    data class UpdatePublicBaseUrlRequest(val publicBaseUrl: String)
    data class AdminSettingsResponse(
        val registrationEnabled: Boolean,
        val email: EmailSettingsResponse,
    )

    data class EmailSettingsResponse(
        val source: EmailConfigurationSource,
        val enabled: Boolean,
        val authEnabled: Boolean,
        val host: String,
        val port: Int?,
        val protocol: String,
        val encryption: EmailEncryption,
        val username: String?,
        val passwordConfigured: Boolean,
        val from: String,
        val fromName: String?,
        val publicBaseUrl: String,
        val validationErrors: List<String>,
    )

    data class UpdateEmailSettingsRequest(
        val enabled: Boolean,
        val authEnabled: Boolean,
        val host: String,
        val port: Int?,
        val protocol: String,
        val encryption: EmailEncryption,
        val username: String?,
        val passwordAction: PasswordAction,
        val password: String?,
        val from: String,
        val fromName: String?,
        val publicBaseUrl: String,
    )

    data class TestEmailRequest(val recipient: String)
    data class TestEmailResponse(
        val status: String,
        val category: String?,
        val message: String?,
        val detail: String?,
        val hint: String?,
    )

    data class UpdateUserRequest(val displayName: String, val email: String)
    data class UpdateAdminRequest(val admin: Boolean)
    data class UpdateBlockedRequest(val blocked: Boolean)

    @ExceptionHandler(ResponseStatusException::class)
    fun adminError(error: ResponseStatusException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(error.statusCode).body(
            ErrorResponse(
                code = adminErrorCode(error.reason),
                message = error.reason ?: "Admin request failed",
            )
        )

    @ExceptionHandler(InvalidEmailConfigurationException::class)
    fun emailSettingsError(error: InvalidEmailConfigurationException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponse(
                code = "EMAIL_SETTINGS_INVALID",
                message = error.errors.joinToString("; "),
            )
        )

    @GetMapping("/settings")
    fun settings(@AuthenticationPrincipal userId: UUID): AdminSettingsResponse {
        adminService.requireAdmin(userId)
        return AdminSettingsResponse(
            registrationEnabled = appSettingsService.isRegistrationEnabled(),
            email = emailSettingsService.activeConfiguration().toEmailSettingsResponse(),
        )
    }

    @PatchMapping("/settings/registration")
    fun updateRegistration(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody body: UpdateRegistrationRequest,
    ): RegistrationSettingResponse {
        adminService.requireAdmin(userId)
        return RegistrationSettingResponse(appSettingsService.setRegistrationEnabled(body.registrationEnabled))
    }

    @PatchMapping("/settings/public-base-url")
    fun updatePublicBaseUrl(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody body: UpdatePublicBaseUrlRequest,
    ): EmailSettingsResponse {
        adminService.requireAdmin(userId)
        return emailSettingsService.savePublicBaseUrl(body.publicBaseUrl).toEmailSettingsResponse()
    }

    @GetMapping("/settings/email")
    fun emailSettings(@AuthenticationPrincipal userId: UUID): EmailSettingsResponse {
        adminService.requireAdmin(userId)
        return emailSettingsService.activeConfiguration().toEmailSettingsResponse()
    }

    @PatchMapping("/settings/email")
    fun updateEmailSettings(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody body: UpdateEmailSettingsRequest,
    ): EmailSettingsResponse {
        adminService.requireAdmin(userId)
        return emailSettingsService.saveRuntimeSettings(body.toEmailSettingsUpdate()).toEmailSettingsResponse()
    }

    @PostMapping("/settings/email/reset")
    fun resetEmailSettings(@AuthenticationPrincipal userId: UUID): EmailSettingsResponse {
        adminService.requireAdmin(userId)
        return emailSettingsService.resetToDeployment().toEmailSettingsResponse()
    }

    @PostMapping("/settings/email/test")
    fun testEmailSettings(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody body: TestEmailRequest,
    ): TestEmailResponse {
        adminService.requireAdmin(userId)
        val recipient = body.recipient.trim()
        validateRecipient(recipient)
        return emailDeliveryService.testEmail(recipient).toTestEmailResponse()
    }

    @GetMapping("/stats")
    fun stats(@AuthenticationPrincipal userId: UUID): AdminService.AdminStats =
        adminService.stats(userId)

    @GetMapping("/users")
    fun users(@AuthenticationPrincipal userId: UUID): List<AdminService.AdminUserDto> =
        adminService.users(userId)

    @PatchMapping("/users/{targetUserId}")
    fun updateUser(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable targetUserId: UUID,
        @RequestBody body: UpdateUserRequest,
    ): AdminService.AdminUserDto =
        adminService.updateUser(userId, targetUserId, body.displayName, body.email).toAdminDto()

    @PatchMapping("/users/{targetUserId}/admin")
    fun updateAdmin(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable targetUserId: UUID,
        @RequestBody body: UpdateAdminRequest,
    ): AdminService.AdminUserDto =
        adminService.setAdmin(userId, targetUserId, body.admin).toAdminDto()

    @PatchMapping("/users/{targetUserId}/blocked")
    fun updateBlocked(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable targetUserId: UUID,
        @RequestBody body: UpdateBlockedRequest,
    ): AdminService.AdminUserDto =
        adminService.setBlocked(userId, targetUserId, body.blocked).toAdminDto()

    @PostMapping("/users/{targetUserId}/recovery-links")
    fun createRecoveryLink(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable targetUserId: UUID,
    ): ResponseEntity<*> {
        val actor = adminService.requireAdmin(userId)
        val target = userRepository.findById(targetUserId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(passkeyRecoveryService.createRecovery(actor, target))
    }

    private fun User.toAdminDto() = AdminService.AdminUserDto(
        id = id,
        email = email,
        displayName = displayName,
        admin = admin,
        blocked = blockedAt != null,
        blockedAt = blockedAt,
        passkeyCount = webAuthnCredentialRepository.countByUserId(id),
        createdAt = createdAt,
    )

    private fun adminErrorCode(reason: String?): String = when (reason) {
        "You cannot block yourself." -> "SELF_BLOCKED"
        "At least one unblocked admin must remain" -> "LAST_ADMIN"
        "User not found" -> "USER_NOT_FOUND"
        "Email is already in use" -> "EMAIL_IN_USE"
        "Cannot create recovery for blocked user" -> "USER_BLOCKED"
        "Invalid test email recipient" -> "EMAIL_RECIPIENT_INVALID"
        else -> "ADMIN_REQUEST_FAILED"
    }

    private fun UpdateEmailSettingsRequest.toEmailSettingsUpdate() = EmailSettingsUpdate(
        enabled = enabled,
        authEnabled = authEnabled,
        host = host,
        port = port,
        protocol = protocol,
        encryption = encryption,
        username = username,
        passwordAction = passwordAction,
        password = password,
        from = from,
        fromName = fromName,
        publicBaseUrl = publicBaseUrl,
    )

    private fun EmailConfiguration.toEmailSettingsResponse() = EmailSettingsResponse(
        source = source,
        enabled = enabled,
        authEnabled = authEnabled,
        host = host,
        port = port,
        protocol = protocol,
        encryption = encryption,
        username = username,
        passwordConfigured = passwordConfigured,
        from = from,
        fromName = fromName,
        publicBaseUrl = publicBaseUrl,
        validationErrors = validationErrors(),
    )

    private fun EmailDeliveryResult.toTestEmailResponse(): TestEmailResponse = when (this) {
        EmailDeliveryResult.Accepted -> TestEmailResponse("ACCEPTED", null, null, null, null)
        is EmailDeliveryResult.Unavailable -> TestEmailResponse("UNAVAILABLE", null, reasons.joinToString("; "), null, null)
        is EmailDeliveryResult.Failed -> TestEmailResponse("FAILED", category.name, message, detail, hint)
    }

    private fun validateRecipient(recipient: String) {
        if (
            recipient.isBlank() ||
            recipient.any { it.isWhitespace() } ||
            !recipient.contains("@") ||
            recipient.substringAfter("@").isBlank() ||
            !recipient.substringAfter("@").contains(".")
        ) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid test email recipient")
        }
        try {
            InternetAddress(recipient).validate()
        } catch (error: AddressException) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid test email recipient")
        }
    }
}
