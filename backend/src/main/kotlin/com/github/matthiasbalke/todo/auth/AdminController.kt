package com.github.matthiasbalke.todo.auth

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
) {

    data class RegistrationSettingResponse(val registrationEnabled: Boolean)
    data class UpdateRegistrationRequest(val registrationEnabled: Boolean)
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

    @GetMapping("/settings")
    fun settings(@AuthenticationPrincipal userId: UUID): RegistrationSettingResponse {
        adminService.requireAdmin(userId)
        return RegistrationSettingResponse(appSettingsService.isRegistrationEnabled())
    }

    @PatchMapping("/settings/registration")
    fun updateRegistration(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody body: UpdateRegistrationRequest,
    ): RegistrationSettingResponse {
        adminService.requireAdmin(userId)
        return RegistrationSettingResponse(appSettingsService.setRegistrationEnabled(body.registrationEnabled))
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
        else -> "ADMIN_REQUEST_FAILED"
    }
}
