package com.github.matthiasbalke.todo.auth

import org.junit.jupiter.api.Test
import org.mockito.Mockito
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class SetupSecretServiceTest {

    @Test
    fun `generated setup secret changes for a new service instance`() {
        val adminService = Mockito.mock(AdminService::class.java)
        Mockito.`when`(adminService.setupRequired()).thenReturn(true)

        val first = SetupSecretService(adminService, FixedSetupSecretGenerator("first-secret"), "")
        first.ensureReadyForSetup()
        assertTrue(first.isValid("first-secret"))

        val restarted = SetupSecretService(adminService, FixedSetupSecretGenerator("second-secret"), "")
        restarted.ensureReadyForSetup()
        assertFalse(restarted.isValid("first-secret"))
        assertTrue(restarted.isValid("second-secret"))
    }

    @Test
    fun `configured setup secret is accepted in test controlled environments`() {
        val adminService = Mockito.mock(AdminService::class.java)
        Mockito.`when`(adminService.setupRequired()).thenReturn(true)

        val service = SetupSecretService(adminService, FixedSetupSecretGenerator("generated-secret"), "configured-secret")

        assertTrue(service.isValid("configured-secret"))
        assertFalse(service.isValid("generated-secret"))
    }

    private class FixedSetupSecretGenerator(private val secret: String) : SetupSecretGenerator {
        override fun generate(): String = secret
    }
}
