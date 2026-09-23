package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.email.EmailDeliveryService
import com.github.matthiasbalke.todo.email.EmailSettingsService
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class AdminControllerAppSettingsTest {

    @Test
    fun `app settings endpoints return and save app settings`() {
        val harness = controller()
        Mockito.`when`(harness.appSettingsService.activeSettings()).thenReturn(
            AppSettings(registrationEnabled = true, publicBaseUrl = "https://todo.example.com")
        )
        Mockito.`when`(
            harness.appSettingsService.saveAppSettings(
                AppSettingsUpdate(registrationEnabled = false, publicBaseUrl = "https://new.example.com")
            )
        ).thenReturn(AppSettings(registrationEnabled = false, publicBaseUrl = "https://new.example.com"))

        val active = harness.controller.appSettings(harness.adminId)
        val updated = harness.controller.updateAppSettings(
            harness.adminId,
            AdminController.UpdateAppSettingsRequest(
                registrationEnabled = false,
                publicBaseUrl = "https://new.example.com",
            )
        )

        assertEquals(true, active.registrationEnabled)
        assertEquals("https://todo.example.com", active.publicBaseUrl)
        assertEquals(false, updated.registrationEnabled)
        assertEquals("https://new.example.com", updated.publicBaseUrl)
    }

    @Test
    fun `app settings endpoints require admin authorization`() {
        val harness = controller()
        val nonAdminId = UUID.randomUUID()
        Mockito.`when`(harness.adminService.requireAdmin(nonAdminId))
            .thenThrow(ResponseStatusException(HttpStatus.FORBIDDEN, "Admin privileges required"))

        assertFailsWith<ResponseStatusException> {
            harness.controller.appSettings(nonAdminId)
        }
        assertFailsWith<ResponseStatusException> {
            harness.controller.updateAppSettings(
                nonAdminId,
                AdminController.UpdateAppSettingsRequest(
                    registrationEnabled = true,
                    publicBaseUrl = "https://todo.example.com",
                )
            )
        }
    }

    private data class Harness(
        val controller: AdminController,
        val adminId: UUID,
        val adminService: AdminService,
        val appSettingsService: AppSettingsService,
    )

    private fun controller(): Harness {
        val adminId = UUID.randomUUID()
        val adminService = Mockito.mock(AdminService::class.java)
        Mockito.`when`(adminService.requireAdmin(adminId)).thenReturn(
            User(id = adminId, email = "admin@example.com", displayName = "Admin", admin = true)
        )
        val appSettingsService = Mockito.mock(AppSettingsService::class.java)
        val controller = AdminController(
            adminService = adminService,
            appSettingsService = appSettingsService,
            userRepository = Mockito.mock(UserRepository::class.java),
            passkeyRecoveryService = Mockito.mock(PasskeyRecoveryService::class.java),
            webAuthnCredentialRepository = Mockito.mock(WebAuthnCredentialRepository::class.java),
            emailSettingsService = Mockito.mock(EmailSettingsService::class.java),
            emailDeliveryService = Mockito.mock(EmailDeliveryService::class.java),
        )
        return Harness(controller, adminId, adminService, appSettingsService)
    }
}
