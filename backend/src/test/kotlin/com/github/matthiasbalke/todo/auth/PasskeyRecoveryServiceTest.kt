package com.github.matthiasbalke.todo.auth

import org.mockito.Mockito
import kotlin.test.Test
import kotlin.test.assertEquals

class PasskeyRecoveryServiceTest {

    @Test
    fun `application link service builds encoded recovery URLs from app public base url`() {
        val appSettingsService = Mockito.mock(AppSettingsService::class.java)
        Mockito.`when`(appSettingsService.publicBaseUrl()).thenReturn("https://todo.example.com/")
        val service = ApplicationLinkService(appSettingsService)

        assertEquals(
            "https://todo.example.com/recover/token%20with%2Fslash",
            service.url(AppRoute.Recovery("token with/slash")),
        )
    }

    @Test
    fun `application link service builds encoded email verification URLs from app public base url`() {
        val appSettingsService = Mockito.mock(AppSettingsService::class.java)
        Mockito.`when`(appSettingsService.publicBaseUrl()).thenReturn("https://todo.example.com/")
        val service = ApplicationLinkService(appSettingsService)

        assertEquals(
            "https://todo.example.com/verify-email?validation_token=token%20with%2Fslash",
            service.url(AppRoute.EmailVerification("token with/slash")),
        )
    }
}
