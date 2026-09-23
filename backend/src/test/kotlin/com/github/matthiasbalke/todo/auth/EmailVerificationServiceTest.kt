package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.email.EmailDeliveryResult
import com.github.matthiasbalke.todo.email.EmailDeliveryService
import com.github.matthiasbalke.todo.email.OutboundEmail
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers
import org.mockito.Mockito
import java.time.Duration
import java.time.Instant
import java.util.Base64
import java.util.Optional
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class EmailVerificationServiceTest {

    @Test
    fun `requesting verification stores token hash and does not expose raw token in state`() {
        val user = User(email = "verify@example.com", displayName = "Verify")
        val harness = harness(user)

        harness.service.requestVerificationEmail(user.id)

        val token = harness.sent.single().rawVerificationToken()
        assertNotEquals(token, user.validationToken)
        assertEquals(harness.jwtTokenService.hashToken(token), user.validationToken)
        assertNotNull(user.validationStarted)

        val state = harness.service.state(user.id)
        assertEquals(false, state.emailVerified)
        assertEquals(true, state.registrationVerification?.tokenRequested)
        assertEquals("verify@example.com", state.registrationVerification?.email)
    }

    @Test
    fun `submitting active registration token verifies account and clears token fields`() {
        val user = User(email = "submit@example.com", displayName = "Submit")
        val harness = harness(user)
        harness.service.requestVerificationEmail(user.id)
        val token = harness.sent.single().rawVerificationToken()

        val response = harness.service.submitToken(user.id, token)

        assertEquals("VERIFIED", response.status)
        assertNotNull(user.validatedAt)
        assertNull(user.validationToken)
        assertNull(user.validationStarted)
    }

    @Test
    fun `registration verification email includes manual token and verification link`() {
        val user = User(email = "body@example.com", displayName = "Body")
        val harness = harness(user)

        harness.service.requestVerificationEmail(user.id)

        val email = harness.sent.single()
        val token = email.rawVerificationToken()
        assertEquals("body@example.com", email.recipient)
        assertEquals("Verify your Todo email address", email.subject)
        assertTrue(email.text.contains(token))
        assertTrue(email.text.contains("https://todo.example.com/verify-email?validation_token=$token"))
        assertTrue(email.text.contains("30 minutes"))
    }

    @Test
    fun `resending registration verification replaces previous token`() {
        val user = User(email = "resend@example.com", displayName = "Resend")
        val harness = harness(user)
        harness.service.requestVerificationEmail(user.id)
        val firstToken = harness.sent.single().rawVerificationToken()
        val firstHash = user.validationToken

        harness.service.requestVerificationEmail(user.id)
        val secondToken = harness.sent.last().rawVerificationToken()

        assertNotEquals(firstHash, user.validationToken)
        assertNotEquals(firstToken, secondToken)
        assertFailsVerification("VALIDATION_TOKEN_INVALID") {
            harness.service.submitToken(user.id, firstToken)
        }
        harness.service.submitToken(user.id, secondToken)
        assertNotNull(user.validatedAt)
    }

    @Test
    fun `submitting missing token fails safely`() {
        val user = User(email = "missing@example.com", displayName = "Missing")
        val harness = harness(user)

        assertFailsVerification("VALIDATION_TOKEN_REQUIRED") {
            harness.service.submitToken(user.id, " ")
        }
    }

    @Test
    fun `submitting invalid token fails safely`() {
        val user = User(email = "invalid@example.com", displayName = "Invalid")
        val harness = harness(user)
        harness.service.requestVerificationEmail(user.id)

        assertFailsVerification("VALIDATION_TOKEN_INVALID") {
            harness.service.submitToken(user.id, "wrong-token")
        }
    }

    @Test
    fun `submitting expired token fails safely`() {
        val jwtTokenService = testJwtTokenService()
        val user = User(
            email = "expired@example.com",
            displayName = "Expired",
            validationToken = jwtTokenService.hashToken("expired-token"),
            validationStarted = Instant.now().minus(Duration.ofHours(1)),
        )
        val harness = harness(user, jwtTokenService = jwtTokenService)

        assertFailsVerification("VALIDATION_TOKEN_EXPIRED") {
            harness.service.submitToken(user.id, "expired-token")
        }
    }

    @Test
    fun `already verified account without pending email does not create a token`() {
        val user = User(email = "verified@example.com", displayName = "Verified", validatedAt = Instant.now())
        val harness = harness(user)

        val response = harness.service.requestVerificationEmail(user.id)

        assertEquals("ALREADY_VERIFIED", response.status)
        assertNull(user.validationToken)
        assertTrue(harness.sent.isEmpty())
    }

    @Test
    fun `pending email verification promotes new email and clears pending fields`() {
        val user = User(email = "active@example.com", displayName = "Pending", validatedAt = Instant.now())
        val harness = harness(user)

        harness.service.startPendingEmailChange(user.id, "pending@example.com")
        val token = harness.sent.first { it.recipient == "pending@example.com" }.rawVerificationToken()

        val response = harness.service.submitToken(user.id, token)

        assertEquals("VERIFIED", response.status)
        assertEquals("pending@example.com", user.email)
        assertNull(user.pendingEmail)
        assertNull(user.pendingEmailToken)
        assertNull(user.pendingEmailStarted)
        assertEquals(2, harness.sent.size)
        assertEquals("active@example.com", harness.sent[1].recipient)
        assertEquals("Todo account email change requested", harness.sent[1].subject)
    }

    @Test
    fun `expired pending email remains visible until cancel or resend`() {
        val startedAt = Instant.now().minus(Duration.ofHours(1))
        val user = User(
            email = "active@example.com",
            displayName = "Pending",
            validatedAt = Instant.now(),
            pendingEmail = "pending@example.com",
            pendingEmailToken = "hash",
            pendingEmailStarted = startedAt,
        )
        val harness = harness(user)

        val state = harness.service.state(user.id)

        assertEquals(true, state.emailVerified)
        assertEquals("pending@example.com", state.pendingEmailChange?.email)
        assertEquals(true, state.pendingEmailChange?.expired)
        assertEquals(startedAt, state.pendingEmailChange?.startedAt)
    }

    @Test
    fun `unavailable email delivery returns safe error`() {
        val user = User(email = "unavailable@example.com", displayName = "Unavailable")
        val harness = harness(user, sendResult = EmailDeliveryResult.Unavailable(listOf("smtp secret")))

        assertFailsVerification("EMAIL_DELIVERY_UNAVAILABLE") {
            harness.service.requestVerificationEmail(user.id)
        }
    }

    @Test
    fun `failed email delivery returns safe category message`() {
        val user = User(email = "failed@example.com", displayName = "Failed")
        val harness = harness(
            user,
            sendResult = EmailDeliveryResult.Failed(
                category = com.github.matthiasbalke.todo.email.EmailFailureCategory.SERVER_UNREACHABLE,
                message = "Email server is not reachable",
                detail = "internal smtp detail",
            ),
        )

        try {
            harness.service.requestVerificationEmail(user.id)
        } catch (error: EmailVerificationException) {
            assertEquals("EMAIL_DELIVERY_FAILED", error.code)
            assertEquals("Email server is not reachable", error.message)
            return
        }
        throw AssertionError("Expected EmailVerificationException")
    }

    private data class Harness(
        val service: EmailVerificationService,
        val sent: MutableList<OutboundEmail>,
        val jwtTokenService: JwtTokenService,
    )

    private fun harness(
        user: User,
        jwtTokenService: JwtTokenService = testJwtTokenService(),
        sendResult: EmailDeliveryResult = EmailDeliveryResult.Accepted,
    ): Harness {
        val userRepository = Mockito.mock(UserRepository::class.java)
        Mockito.`when`(userRepository.findById(user.id)).thenReturn(Optional.of(user))
        Mockito.`when`(userRepository.save(ArgumentMatchers.any(User::class.java) ?: user)).thenAnswer {
            it.arguments[0] as User
        }

        val appSettingsService = Mockito.mock(AppSettingsService::class.java)
        Mockito.`when`(appSettingsService.emailValidationTimeout()).thenReturn(Duration.ofMinutes(30))
        Mockito.`when`(appSettingsService.publicBaseUrl()).thenReturn("https://todo.example.com")

        val applicationLinkService = ApplicationLinkService(appSettingsService)
        val sent = mutableListOf<OutboundEmail>()
        val emailDeliveryService = Mockito.mock(EmailDeliveryService::class.java)
        Mockito.`when`(emailDeliveryService.send(ArgumentMatchers.any(OutboundEmail::class.java) ?: OutboundEmail("", "", ""))).thenAnswer { invocation ->
            sent.add(invocation.arguments[0] as OutboundEmail)
            sendResult
        }

        return Harness(
            service = EmailVerificationService(
                userRepository = userRepository,
                appSettingsService = appSettingsService,
                jwtTokenService = jwtTokenService,
                applicationLinkService = applicationLinkService,
                emailDeliveryService = emailDeliveryService,
            ),
            sent = sent,
            jwtTokenService = jwtTokenService,
        )
    }

    private fun OutboundEmail.rawVerificationToken(): String =
        text.lines().first { it.matches(Regex("[A-Za-z0-9_-]{40,}")) }

    private fun testJwtTokenService(): JwtTokenService = JwtTokenService(
        JwtProperties(
            secret = Base64.getEncoder().encodeToString(ByteArray(32) { 7 }),
            issuer = "todo-test",
            audience = "todo-test",
            accessTokenTtl = Duration.ofMinutes(15),
            refreshTokenTtl = Duration.ofDays(30),
        )
    )

    private fun assertFailsVerification(code: String, block: () -> Unit) {
        try {
            block()
        } catch (error: EmailVerificationException) {
            assertEquals(code, error.code)
            return
        }
        throw AssertionError("Expected EmailVerificationException with code $code")
    }
}
