package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.email.EmailDeliveryResult
import com.github.matthiasbalke.todo.email.EmailDeliveryService
import com.github.matthiasbalke.todo.email.OutboundEmail
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers
import org.mockito.Mockito
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.util.UUID
import kotlin.test.assertNotNull
import kotlin.test.assertNull

@AutoConfigureMockMvc
class EmailVerificationIntegrationTest : AbstractIntegrationTest() {

    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var jwtTokenService: JwtTokenService
    @MockitoBean private lateinit var emailDeliveryService: EmailDeliveryService

    private val sent = mutableListOf<OutboundEmail>()

    @BeforeEach
    fun configureEmailDelivery() {
        sent.clear()
        Mockito.reset(emailDeliveryService)
        Mockito.`when`(emailDeliveryService.send(ArgumentMatchers.any(OutboundEmail::class.java) ?: OutboundEmail("", "", ""))).thenAnswer { invocation ->
            sent.add(invocation.arguments[0] as OutboundEmail)
            EmailDeliveryResult.Accepted
        }
    }

    @Test
    fun `unverified user can request and submit verification token`() {
        val user = userRepository.save(User(email = "verify-${UUID.randomUUID()}@example.com", displayName = "Verify"))
        val bearer = bearerHeader(user)

        mockMvc.get("/api/users/me/verification") {
            header("Authorization", bearer)
        }.andExpect {
            status { isOk() }
            jsonPath("$.emailVerified") { value(false) }
            jsonPath("$.registrationVerification.email") { value(user.email) }
            jsonPath("$.registrationVerification.tokenRequested") { value(false) }
            jsonPath("$.registrationVerification.validationToken") { doesNotExist() }
        }

        mockMvc.post("/api/users/me/verification/email") {
            header("Authorization", bearer)
            contentType = MediaType.APPLICATION_JSON
            content = "{}"
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("SENT") }
        }

        val storedWithToken = userRepository.findById(user.id).orElseThrow()
        assertNotNull(storedWithToken.validationToken)
        val token = sent.single().rawVerificationToken()

        mockMvc.post("/api/users/me/verification") {
            header("Authorization", bearer)
            contentType = MediaType.APPLICATION_JSON
            content = """{"validationToken":"$token"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("VERIFIED") }
            jsonPath("$.emailVerified") { value(true) }
        }

        val verified = userRepository.findById(user.id).orElseThrow()
        assertNotNull(verified.validatedAt)
        assertNull(verified.validationToken)
        assertNull(verified.validationStarted)
    }

    @Test
    fun `unverified user is blocked from normal application APIs`() {
        val user = userRepository.save(User(email = "blocked-${UUID.randomUUID()}@example.com", displayName = "Blocked"))
        val bearer = bearerHeader(user)

        mockMvc.get("/api/users/me") {
            header("Authorization", bearer)
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/api/lists") {
            header("Authorization", bearer)
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("EMAIL_VERIFICATION_REQUIRED") }
        }
    }

    private fun bearerHeader(user: User) = "Bearer ${jwtTokenService.generateAccessToken(user)}"

    private fun OutboundEmail.rawVerificationToken(): String =
        text.lines().first { it.matches(Regex("[A-Za-z0-9_-]{40,}")) }
}
