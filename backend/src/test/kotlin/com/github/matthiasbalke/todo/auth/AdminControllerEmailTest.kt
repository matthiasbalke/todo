package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.email.EmailConfiguration
import com.github.matthiasbalke.todo.email.EmailConfigurationSource
import com.github.matthiasbalke.todo.email.EmailDeliveryResult
import com.github.matthiasbalke.todo.email.EmailDeliveryService
import com.github.matthiasbalke.todo.email.EmailFailureCategory
import com.github.matthiasbalke.todo.email.EmailEncryption
import com.github.matthiasbalke.todo.email.EmailSettingsService
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.web.server.ResponseStatusException
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class AdminControllerEmailTest {

    @Test
    fun `email settings response redacts SMTP password`() {
        val harness = controller()
        Mockito.`when`(harness.emailSettingsService.activeConfiguration()).thenReturn(configuration(password = "secret"))

        val response = harness.controller.emailSettings(harness.adminId)

        assertTrue(response.passwordConfigured)
        assertEquals("mailer", response.username)
    }

    @Test
    fun `test email rejects invalid recipient`() {
        val harness = controller()

        assertFailsWith<ResponseStatusException> {
            harness.controller.testEmailSettings(harness.adminId, AdminController.TestEmailRequest("not-an-address"))
        }
    }

    @Test
    fun `test email sends to requested recipient`() {
        val harness = controller()
        Mockito.`when`(harness.emailDeliveryService.testEmail("recipient@example.com"))
            .thenReturn(EmailDeliveryResult.Accepted)

        val response = harness.controller.testEmailSettings(
            harness.adminId,
            AdminController.TestEmailRequest(" recipient@example.com "),
        )

        assertEquals("ACCEPTED", response.status)
        Mockito.verify(harness.emailDeliveryService).testEmail("recipient@example.com")
    }

    @Test
    fun `test email maps unavailable and failed results safely`() {
        val harness = controller()
        Mockito.`when`(harness.emailDeliveryService.testEmail("missing@example.com"))
            .thenReturn(EmailDeliveryResult.Unavailable(listOf("SMTP host is required")))
        Mockito.`when`(harness.emailDeliveryService.testEmail("failed@example.com"))
            .thenReturn(EmailDeliveryResult.Failed(
                EmailFailureCategory.AUTHENTICATION,
                "Email provider authentication failed",
                detail = "The SMTP server rejected the configured username or password.",
                hint = "Check whether SMTP authentication is required and verify the username and password.",
            ))

        val unavailable = harness.controller.testEmailSettings(
            harness.adminId,
            AdminController.TestEmailRequest("missing@example.com"),
        )
        val failed = harness.controller.testEmailSettings(
            harness.adminId,
            AdminController.TestEmailRequest("failed@example.com"),
        )

        assertEquals("UNAVAILABLE", unavailable.status)
        assertEquals("SMTP host is required", unavailable.message)
        assertEquals("FAILED", failed.status)
        assertEquals("AUTHENTICATION", failed.category)
        assertEquals("Email provider authentication failed", failed.message)
        assertEquals("The SMTP server rejected the configured username or password.", failed.detail)
        assertEquals("Check whether SMTP authentication is required and verify the username and password.", failed.hint)
    }

    @Test
    fun `email settings endpoints require admin authorization`() {
        val harness = controller()
        val nonAdminId = UUID.randomUUID()
        Mockito.`when`(harness.adminService.requireAdmin(nonAdminId))
            .thenThrow(ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Admin privileges required"))

        assertFailsWith<ResponseStatusException> {
            harness.controller.emailSettings(nonAdminId)
        }
        assertFailsWith<ResponseStatusException> {
            harness.controller.testEmailSettings(nonAdminId, AdminController.TestEmailRequest("recipient@example.com"))
        }
    }

    private data class Harness(
        val controller: AdminController,
        val adminId: UUID,
        val adminService: AdminService,
        val emailSettingsService: EmailSettingsService,
        val emailDeliveryService: EmailDeliveryService,
    )

    private fun controller(): Harness {
        val adminId = UUID.randomUUID()
        val adminService = Mockito.mock(AdminService::class.java)
        Mockito.`when`(adminService.requireAdmin(adminId)).thenReturn(
            User(id = adminId, email = "admin@example.com", displayName = "Admin", admin = true)
        )
        val emailSettingsService = Mockito.mock(EmailSettingsService::class.java)
        val emailDeliveryService = Mockito.mock(EmailDeliveryService::class.java)
        val controller = AdminController(
            adminService = adminService,
            appSettingsService = Mockito.mock(AppSettingsService::class.java),
            userRepository = Mockito.mock(UserRepository::class.java),
            passkeyRecoveryService = Mockito.mock(PasskeyRecoveryService::class.java),
            webAuthnCredentialRepository = Mockito.mock(WebAuthnCredentialRepository::class.java),
            emailSettingsService = emailSettingsService,
            emailDeliveryService = emailDeliveryService,
        )
        return Harness(controller, adminId, adminService, emailSettingsService, emailDeliveryService)
    }

    private fun configuration(password: String?) = EmailConfiguration(
        source = EmailConfigurationSource.RUNTIME,
        enabled = true,
        authEnabled = true,
        host = "smtp.example.com",
        port = 587,
        protocol = "smtp",
        encryption = EmailEncryption.STARTTLS,
        username = "mailer",
        password = password,
        from = "todo@example.com",
        fromName = "Todo",
        publicBaseUrl = "https://todo.example.com",
    )
}
