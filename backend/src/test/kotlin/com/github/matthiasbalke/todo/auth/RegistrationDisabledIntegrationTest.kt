package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

@AutoConfigureMockMvc
@TestPropertySource(properties = ["app.registration.enabled=false"])
class RegistrationDisabledIntegrationTest : AbstractIntegrationTest() {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `config returns registrationEnabled false when disabled`() {
        mockMvc.get("/api/auth/config").andExpect {
            status { isOk() }
            jsonPath("$.registrationEnabled") { value(false) }
        }
    }

    @Test
    fun `register-options returns 403 REGISTRATION_DISABLED when registration is off`() {
        mockMvc.post("/api/auth/webauthn/register-options") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"new@example.com","displayName":"New User"}"""
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("REGISTRATION_DISABLED") }
        }
    }

    @Test
    fun `register returns 403 REGISTRATION_DISABLED when registration is off`() {
        mockMvc.post("/api/auth/webauthn/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"id":"dGVzdA","rawId":"dGVzdA","response":{"clientDataJSON":"e30","attestationObject":"e30"},"type":"public-key"}"""
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("REGISTRATION_DISABLED") }
        }
    }
}
