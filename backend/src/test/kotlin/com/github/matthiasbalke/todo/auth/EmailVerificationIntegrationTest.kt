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
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import java.util.UUID
import kotlin.test.assertFalse
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
    fun `verification endpoints return safe controller errors`() {
        val user = userRepository.save(User(email = "safe-errors-${UUID.randomUUID()}@example.com", displayName = "Safe Errors"))
        val bearer = bearerHeader(user)

        mockMvc.post("/api/users/me/verification") {
            header("Authorization", bearer)
            contentType = MediaType.APPLICATION_JSON
            content = """{"validationToken":" "}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_TOKEN_REQUIRED") }
            jsonPath("$.message") { value("Verification token is required.") }
        }

        mockMvc.post("/api/users/me/verification") {
            header("Authorization", bearer)
            contentType = MediaType.APPLICATION_JSON
            content = """{"validationToken":"wrong-token"}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_TOKEN_INVALID") }
            jsonPath("$.message") { value("Verification token is invalid.") }
        }
    }

    @Test
    fun `verification email delivery failure returns safe controller error`() {
        Mockito.`when`(emailDeliveryService.send(ArgumentMatchers.any(OutboundEmail::class.java) ?: OutboundEmail("", "", ""))).thenReturn(
            EmailDeliveryResult.Unavailable(listOf("smtp-password=secret"))
        )
        val user = userRepository.save(User(email = "delivery-failure-${UUID.randomUUID()}@example.com", displayName = "Delivery Failure"))

        val response = mockMvc.post("/api/users/me/verification/email") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = "{}"
        }.andExpect {
            status { isServiceUnavailable() }
            jsonPath("$.code") { value("EMAIL_DELIVERY_UNAVAILABLE") }
            jsonPath("$.message") { value("Email delivery is unavailable.") }
        }.andReturn().response.contentAsString

        assertFalse(response.contains("secret"))
        assertFalse(response.contains("validation_token"))
    }

    @Test
    fun `unverified user allowlist permits only session profile and verification endpoints`() {
        val user = userRepository.save(User(email = "blocked-${UUID.randomUUID()}@example.com", displayName = "Blocked"))
        val bearer = bearerHeader(user)
        val token = bearer.removePrefix("Bearer ")
        val listId = UUID.randomUUID()
        val itemId = UUID.randomUUID()
        val categoryId = UUID.randomUUID()
        val groupId = UUID.randomUUID()

        mockMvc.get("/api/users/me") {
            header("Authorization", bearer)
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/api/users/me/verification") {
            header("Authorization", bearer)
        }.andExpect {
            status { isOk() }
        }

        mockMvc.post("/api/users/me/verification/email") {
            header("Authorization", bearer)
            contentType = MediaType.APPLICATION_JSON
            content = "{}"
        }.andExpect {
            status { isOk() }
        }

        mockMvc.post("/api/users/me/verification") {
            header("Authorization", bearer)
            contentType = MediaType.APPLICATION_JSON
            content = """{"validationToken":"wrong-token"}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_TOKEN_INVALID") }
        }

        mockMvc.delete("/api/users/me/verification/pending-email") {
            header("Authorization", bearer)
        }.andExpect {
            status { isOk() }
        }

        expectEmailVerificationRequired("lists") {
            mockMvc.get("/api/lists") {
                header("Authorization", bearer)
            }
        }
        expectEmailVerificationRequired("list groups") {
            mockMvc.get("/api/list-groups") {
                header("Authorization", bearer)
            }
        }
        expectEmailVerificationRequired("list events") {
            mockMvc.get("/api/lists/$listId/events?token=$token")
        }
        expectEmailVerificationRequired("items") {
            mockMvc.get("/api/lists/$listId/items") {
                header("Authorization", bearer)
            }
        }
        expectEmailVerificationRequired("categories") {
            mockMvc.get("/api/lists/$listId/categories") {
                header("Authorization", bearer)
            }
        }
        expectEmailVerificationRequired("today") {
            mockMvc.get("/api/today") {
                header("Authorization", bearer)
            }
        }
        expectEmailVerificationRequired("admin") {
            mockMvc.get("/api/admin/users") {
                header("Authorization", bearer)
            }
        }
        expectEmailVerificationRequired("account mutation") {
            mockMvc.put("/api/users/me") {
                header("Authorization", bearer)
                contentType = MediaType.APPLICATION_JSON
                content = """{"displayName":"Blocked","email":"${user.email}"}"""
            }
        }
        expectEmailVerificationRequired("preferences") {
            mockMvc.put("/api/users/me/preferences") {
                header("Authorization", bearer)
                contentType = MediaType.APPLICATION_JSON
                content = """{"timeZone":"UTC","todayViewEnabled":true,"themePreference":"SYSTEM"}"""
            }
        }
        expectEmailVerificationRequired("passkey management") {
            mockMvc.get("/api/users/me/passkeys") {
                header("Authorization", bearer)
            }
        }
        expectEmailVerificationRequired("passkey registration") {
            mockMvc.post("/api/users/me/passkeys/register-options") {
                header("Authorization", bearer)
            }
        }
        expectEmailVerificationRequired("deletion preview") {
            mockMvc.get("/api/users/me/deletion-preview") {
                header("Authorization", bearer)
            }
        }
        expectEmailVerificationRequired("account deletion") {
            mockMvc.delete("/api/users/me") {
                header("Authorization", bearer)
            }
        }
        expectEmailVerificationRequired("item mutation") {
            mockMvc.patch("/api/lists/$listId/items/$itemId/done") {
                header("Authorization", bearer)
            }
        }
        expectEmailVerificationRequired("category mutation") {
            mockMvc.delete("/api/lists/$listId/categories/$categoryId") {
                header("Authorization", bearer)
            }
        }
        expectEmailVerificationRequired("list group mutation") {
            mockMvc.patch("/api/list-groups/$groupId/order") {
                header("Authorization", bearer)
                contentType = MediaType.APPLICATION_JSON
                content = """{"sortOrder":1}"""
            }
        }
    }

    @Test
    fun `verified user with pending email can access normal application APIs`() {
        val user = userRepository.save(
            User(
                email = "verified-pending-${UUID.randomUUID()}@example.com",
                displayName = "Verified Pending",
                validatedAt = java.time.Instant.now(),
                pendingEmail = "pending-${UUID.randomUUID()}@example.com",
            )
        )

        mockMvc.get("/api/lists") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isOk() }
        }
    }

    private fun expectEmailVerificationRequired(label: String, request: () -> ResultActionsDsl) {
        request().andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("EMAIL_VERIFICATION_REQUIRED") }
            jsonPath("$.message") { value("Email verification is required.") }
        }
    }

    @Test
    fun `unverified user is blocked from normal application APIs`() {
        val user = userRepository.save(User(email = "blocked-legacy-${UUID.randomUUID()}@example.com", displayName = "Blocked"))

        mockMvc.get("/api/lists") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("EMAIL_VERIFICATION_REQUIRED") }
        }
    }

    private fun bearerHeader(user: User) = "Bearer ${jwtTokenService.generateAccessToken(user)}"

    private fun OutboundEmail.rawVerificationToken(): String =
        text.lines().first { it.matches(Regex("[A-Za-z0-9_-]{40,}")) }
}
