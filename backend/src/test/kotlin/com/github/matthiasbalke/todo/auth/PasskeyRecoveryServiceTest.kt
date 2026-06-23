package com.github.matthiasbalke.todo.auth

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class PasskeyRecoveryServiceTest {

    @Test
    fun `public recovery URL base uses first configured CORS origin`() {
        assertEquals(
            "https://todo.example.com",
            PasskeyRecoveryService.publicBaseUrlFromAllowedOrigins("https://todo.example.com,https://localhost:8443"),
        )
    }

    @Test
    fun `public recovery URL base removes default ports`() {
        assertEquals(
            "https://todo.example.com",
            PasskeyRecoveryService.publicBaseUrlFromAllowedOrigins("https://todo.example.com:443"),
        )
        assertEquals(
            "http://todo.example.com",
            PasskeyRecoveryService.publicBaseUrlFromAllowedOrigins("http://todo.example.com:80"),
        )
    }

    @Test
    fun `public recovery URL base rejects missing configured origin`() {
        assertFailsWith<IllegalStateException> {
            PasskeyRecoveryService.publicBaseUrlFromAllowedOrigins(" , ")
        }
    }
}
