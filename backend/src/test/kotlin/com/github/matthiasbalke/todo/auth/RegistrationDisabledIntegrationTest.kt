package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.email.EmailEncryption
import com.github.matthiasbalke.todo.email.EmailSettingsService
import com.github.matthiasbalke.todo.email.EmailSettingsUpdate
import com.github.matthiasbalke.todo.email.PasswordAction
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
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

    @Autowired
    private lateinit var appSettingsService: AppSettingsService

    @Autowired
    private lateinit var emailSettingsService: EmailSettingsService

    @Autowired
    private lateinit var userRepository: UserRepository

    @BeforeEach
    fun disableRegistration() {
        appSettingsService.setRegistrationEnabled(false)
    }

    @AfterEach
    fun resetEmailSettings() {
        emailSettingsService.resetToDeployment()
    }

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
            content = """{"credential":{"id":"dGVzdA","rawId":"dGVzdA","response":{"clientDataJSON":"e30","attestationObject":"e30"},"type":"public-key"},"label":null}"""
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("REGISTRATION_DISABLED") }
        }
    }

    @Test
    fun `register-options returns generic disabled response when email delivery is unavailable`() {
        appSettingsService.setRegistrationEnabled(true)
        emailSettingsService.saveRuntimeSettings(
            EmailSettingsUpdate(
                enabled = false,
                authEnabled = false,
                host = "",
                port = null,
                protocol = "smtp",
                encryption = EmailEncryption.STARTTLS,
                username = null,
                passwordAction = PasswordAction.CLEAR,
                password = null,
                from = "",
                fromName = null,
            )
        )

        mockMvc.get("/api/auth/config").andExpect {
            status { isOk() }
            jsonPath("$.registrationEnabled") { value(false) }
        }

        mockMvc.post("/api/auth/webauthn/register-options") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"email-unavailable@example.com","displayName":"New User"}"""
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("REGISTRATION_DISABLED") }
            jsonPath("$.message") { value("Registration is currently disabled") }
        }

        kotlin.test.assertNull(userRepository.findByEmailIdentity("email-unavailable@example.com"))
    }
}
