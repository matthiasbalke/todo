package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.email.EmailDeliveryResult
import com.github.matthiasbalke.todo.email.EmailDeliveryService
import com.github.matthiasbalke.todo.email.EmailEncryption
import com.github.matthiasbalke.todo.email.EmailFailureCategory
import com.github.matthiasbalke.todo.email.EmailSettingsService
import com.github.matthiasbalke.todo.email.EmailSettingsUpdate
import com.github.matthiasbalke.todo.email.PasswordAction
import org.hamcrest.Matchers.greaterThanOrEqualTo
import org.junit.jupiter.api.Test
import org.mockito.BDDMockito.given
import org.mockito.Mockito
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.mock.web.MockHttpSession
import org.springframework.security.web.webauthn.api.Bytes
import org.springframework.security.web.webauthn.api.ImmutableCredentialRecord
import org.springframework.security.web.webauthn.api.ImmutablePublicKeyCose
import org.springframework.security.web.webauthn.api.PublicKeyCredentialCreationOptions
import org.springframework.security.web.webauthn.management.ImmutableRelyingPartyRegistrationRequest
import org.springframework.security.web.webauthn.management.WebAuthnRelyingPartyOperations
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import java.time.Instant
import java.util.Base64
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

@AutoConfigureMockMvc
class AdminAreaIntegrationTest : AbstractIntegrationTest() {

    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var webAuthnCredentialRepository: WebAuthnCredentialRepository
    @Autowired private lateinit var refreshTokenRepository: RefreshTokenRepository
    @Autowired private lateinit var jwtTokenService: JwtTokenService
    @Autowired private lateinit var appSettingsService: AppSettingsService
    @Autowired private lateinit var emailSettingsService: EmailSettingsService
    @Autowired private lateinit var passkeyRecoveryTokenRepository: PasskeyRecoveryTokenRepository
    @Autowired private lateinit var passkeyRecoveryService: PasskeyRecoveryService
    @MockitoBean private lateinit var rpOperations: WebAuthnRelyingPartyOperations
    @MockitoBean private lateinit var emailDeliveryService: EmailDeliveryService

    private fun createUser(
        email: String = "user-${UUID.randomUUID()}@example.com",
        admin: Boolean = false,
        blocked: Boolean = false,
    ): User = userRepository.save(
        User(
            email = email,
            displayName = "Test User",
            admin = admin,
            blockedAt = if (blocked) java.time.Instant.now() else null,
        )
    )

    private fun bearer(user: User) = "Bearer ${jwtTokenService.generateAccessToken(user)}"

    private fun createPasskey(user: User) {
        webAuthnCredentialRepository.save(
            WebAuthnCredential(
                userId = user.id,
                credentialId = "cred-${UUID.randomUUID()}",
                publicKey = ByteArray(32),
                attestationObject = ByteArray(32),
            )
        )
    }

    private fun validEmailSettingsUpdate() = EmailSettingsUpdate(
        enabled = true,
        authEnabled = true,
        host = "smtp.example.com",
        port = 587,
        protocol = "smtp",
        encryption = EmailEncryption.STARTTLS,
        username = "mailer",
        passwordAction = PasswordAction.REPLACE,
        password = "smtp-secret",
        from = "todo@example.com",
        fromName = "Todo",
    )

    private fun validEmailSettingsJson(
        host: String = "smtp.example.com",
        port: Int = 587,
        password: String = "smtp-secret",
    ) = """
        {
          "enabled": true,
          "authEnabled": true,
          "host": "$host",
          "port": $port,
          "protocol": "smtp",
          "encryption": "STARTTLS",
          "username": "mailer",
          "passwordAction": "REPLACE",
          "password": "$password",
          "from": "todo@example.com",
          "fromName": "Todo"
        }
    """.trimIndent()

    @Test
    fun `setup status reports whether admin users exist`() {
        mockMvc.get("/api/setup").andExpect {
            status { isOk() }
            jsonPath("$.setupRequired") { exists() }
        }
    }

    @Test
    fun `admin APIs reject unauthenticated and non-admin users`() {
        val user = createUser()

        mockMvc.get("/api/admin/stats").andExpect {
            status { is4xxClientError() }
        }
        mockMvc.get("/api/admin/stats") {
            header("Authorization", bearer(user))
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `admin can save runtime app settings`() {
        val admin = createUser(admin = true)

        mockMvc.patch("/api/admin/settings/app") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"registrationEnabled":false,"publicBaseUrl":"https://todo.example.com"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.registrationEnabled") { value(false) }
            jsonPath("$.publicBaseUrl") { value("https://todo.example.com") }
        }
        assertFalse(appSettingsService.isRegistrationEnabled())
        assertEquals("https://todo.example.com", appSettingsService.publicBaseUrl())

        mockMvc.patch("/api/admin/settings/app") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"registrationEnabled":true,"publicBaseUrl":"https://todo.example.com/"}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("APP_SETTINGS_INVALID") }
        }

        mockMvc.get("/api/admin/settings/app") {
            header("Authorization", bearer(admin))
        }.andExpect {
            status { isOk() }
            jsonPath("$.registrationEnabled") { value(false) }
            jsonPath("$.publicBaseUrl") { value("https://todo.example.com") }
        }
    }

    @Test
    fun `admin app settings APIs reject unauthenticated and non-admin users`() {
        val user = createUser()

        mockMvc.get("/api/admin/settings/app").andExpect {
            status { is4xxClientError() }
        }
        mockMvc.get("/api/admin/settings/app") {
            header("Authorization", bearer(user))
        }.andExpect {
            status { isForbidden() }
        }
        mockMvc.patch("/api/admin/settings/app") {
            header("Authorization", bearer(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"registrationEnabled":true,"publicBaseUrl":"https://todo.example.com"}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `admin email settings APIs reject unauthenticated and non-admin users`() {
        val user = createUser()

        mockMvc.get("/api/admin/settings/email").andExpect {
            status { is4xxClientError() }
        }
        mockMvc.get("/api/admin/settings/email") {
            header("Authorization", bearer(user))
        }.andExpect {
            status { isForbidden() }
        }
        mockMvc.post("/api/admin/settings/email/test") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"recipient":"recipient@example.com"}"""
        }.andExpect {
            status { is4xxClientError() }
        }
        mockMvc.post("/api/admin/settings/email/test") {
            header("Authorization", bearer(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"recipient":"recipient@example.com"}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `admin email settings response redacts password and exposes source`() {
        val admin = createUser(admin = true)
        emailSettingsService.resetToDeployment()

        mockMvc.patch("/api/admin/settings/email") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = validEmailSettingsJson(password = "smtp-secret")
        }.andExpect {
            status { isOk() }
            jsonPath("$.source") { value("RUNTIME") }
            jsonPath("$.host") { value("smtp.example.com") }
            jsonPath("$.username") { value("mailer") }
            jsonPath("$.passwordConfigured") { value(true) }
            jsonPath("$.password") { doesNotExist() }
        }

        mockMvc.get("/api/admin/settings/email") {
            header("Authorization", bearer(admin))
        }.andExpect {
            status { isOk() }
            jsonPath("$.source") { value("RUNTIME") }
            jsonPath("$.passwordConfigured") { value(true) }
            jsonPath("$.password") { doesNotExist() }
        }
    }

    @Test
    fun `invalid admin email settings update leaves active settings unchanged`() {
        val admin = createUser(admin = true)
        emailSettingsService.resetToDeployment()
        emailSettingsService.saveRuntimeSettings(validEmailSettingsUpdate())

        mockMvc.patch("/api/admin/settings/email") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = validEmailSettingsJson(host = "", port = 70000)
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("EMAIL_SETTINGS_INVALID") }
        }

        mockMvc.get("/api/admin/settings/email") {
            header("Authorization", bearer(admin))
        }.andExpect {
            status { isOk() }
            jsonPath("$.host") { value("smtp.example.com") }
            jsonPath("$.port") { value(587) }
        }
    }

    @Test
    fun `admin test email endpoint maps success unavailable failed and invalid recipient`() {
        val admin = createUser(admin = true)
        given(emailDeliveryService.testEmail("ok@example.com")).willReturn(EmailDeliveryResult.Accepted)
        given(emailDeliveryService.testEmail("missing@example.com"))
            .willReturn(EmailDeliveryResult.Unavailable(listOf("Email delivery is disabled")))
        given(emailDeliveryService.testEmail("failed@example.com"))
            .willReturn(EmailDeliveryResult.Failed(
                EmailFailureCategory.PROVIDER_REJECTED,
                "Email delivery failed",
                detail = "The SMTP server rejected the test message after the connection was established.",
                hint = "Check the sender address, recipient address, provider policy, and any SMTP relay restrictions.",
            ))

        mockMvc.post("/api/admin/settings/email/test") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"recipient":"ok@example.com"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("ACCEPTED") }
        }

        mockMvc.post("/api/admin/settings/email/test") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"recipient":"missing@example.com"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("UNAVAILABLE") }
            jsonPath("$.message") { value("Email delivery is disabled") }
        }

        mockMvc.post("/api/admin/settings/email/test") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"recipient":"failed@example.com"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("FAILED") }
            jsonPath("$.category") { value("PROVIDER_REJECTED") }
            jsonPath("$.message") { value("Email delivery failed") }
            jsonPath("$.detail") { value("The SMTP server rejected the test message after the connection was established.") }
            jsonPath("$.hint") { value("Check the sender address, recipient address, provider policy, and any SMTP relay restrictions.") }
        }

        mockMvc.post("/api/admin/settings/email/test") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"recipient":"not-an-address"}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("EMAIL_RECIPIENT_INVALID") }
        }
    }

    @Test
    fun `admin stats and user list include basic account data`() {
        val admin = createUser(admin = true)
        val user = createUser()
        createPasskey(user)

        mockMvc.get("/api/admin/stats") {
            header("Authorization", bearer(admin))
        }.andExpect {
            status { isOk() }
            jsonPath("$.users") { value(greaterThanOrEqualTo(2)) }
            jsonPath("$.admins") { value(greaterThanOrEqualTo(1)) }
            jsonPath("$.blockedUsers") { exists() }
            jsonPath("$.lists") { exists() }
            jsonPath("$.todoItems") { exists() }
        }

        mockMvc.get("/api/admin/users") {
            header("Authorization", bearer(admin))
        }.andExpect {
            status { isOk() }
            jsonPath("$[?(@.id == '${user.id}')].email") { value(user.email) }
            jsonPath("$[?(@.id == '${user.id}')].passkeyCount") { value(1) }
        }
    }

    @Test
    fun `admin can edit profile and duplicate email is rejected`() {
        val admin = createUser(admin = true)
        val target = createUser()
        val other = createUser("Other-${UUID.randomUUID()}@Example.com")
        val newEmail = "updated-${UUID.randomUUID()}@example.com"

        mockMvc.patch("/api/admin/users/${target.id}") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"displayName":"Updated User","email":"$newEmail"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.displayName") { value("Updated User") }
            jsonPath("$.email") { value(newEmail) }
        }

        mockMvc.patch("/api/admin/users/${target.id}") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"displayName":"Updated User","email":"  ${other.email.lowercase()}  "}"""
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("EMAIL_IN_USE") }
            jsonPath("$.message") { value("Email is already in use") }
        }

        assertEquals(newEmail, userRepository.findById(target.id).orElseThrow().email)
    }

    @Test
    fun `admin can change only target email casing and stores trimmed email`() {
        val admin = createUser(admin = true)
        val target = createUser("Target-${UUID.randomUUID()}@Example.com")
        val updatedEmail = target.email.uppercase()

        mockMvc.patch("/api/admin/users/${target.id}") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"displayName":"Updated User","email":"  $updatedEmail  "}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.displayName") { value("Updated User") }
            jsonPath("$.email") { value(updatedEmail) }
        }

        assertEquals(updatedEmail, userRepository.findById(target.id).orElseThrow().email)
    }

    @Test
    fun `admin grant revoke and block operations preserve usable admin`() {
        val admin = createUser(admin = true)
        val secondAdmin = createUser(admin = true)
        val user = createUser()

        mockMvc.patch("/api/admin/users/${user.id}/admin") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"admin":true}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.admin") { value(true) }
        }

        mockMvc.patch("/api/admin/users/${admin.id}/blocked") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"blocked":true}"""
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("SELF_BLOCKED") }
            jsonPath("$.message") { value("You cannot block yourself.") }
        }

        mockMvc.patch("/api/admin/users/${secondAdmin.id}/blocked") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"blocked":true}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.blocked") { value(true) }
        }
    }

    @Test
    fun `blocking invalidates refresh tokens and rejects blocked access tokens`() {
        val admin = createUser(admin = true)
        val target = createUser()
        refreshTokenRepository.save(
            RefreshToken(
                userId = target.id,
                tokenHash = "hash-${UUID.randomUUID()}",
                expiresAt = java.time.Instant.now().plusSeconds(3600),
            )
        )

        mockMvc.patch("/api/admin/users/${target.id}/blocked") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"blocked":true}"""
        }.andExpect {
            status { isOk() }
        }

        assertEquals(0, refreshTokenRepository.findAll().count { it.userId == target.id })
        mockMvc.get("/api/users/me") {
            header("Authorization", bearer(target))
        }.andExpect {
            status { isForbidden() }
            content { contentType(MediaType.APPLICATION_JSON) }
            jsonPath("$.code") { value("ACCOUNT_BLOCKED") }
            jsonPath("$.message") { value("Account is blocked") }
        }
    }

    @Test
    fun `recovery link creation rejects blocked users and stores token metadata`() {
        val admin = createUser(admin = true)
        val target = createUser()
        val blocked = createUser(blocked = true)
        appSettingsService.saveAppSettings(
            AppSettingsUpdate(
                registrationEnabled = false,
                publicBaseUrl = "https://todo.example.com",
            )
        )

        mockMvc.post("/api/admin/users/${target.id}/recovery-links") {
            header("Authorization", bearer(admin))
        }.andExpect {
            status { isCreated() }
            jsonPath("$.url") { value(org.hamcrest.Matchers.startsWith("https://todo.example.com/recover/")) }
            jsonPath("$.expiresAt") { exists() }
        }
        assertTrue(passkeyRecoveryTokenRepository.findAll().any { it.userId == target.id })

        mockMvc.post("/api/admin/users/${blocked.id}/recovery-links") {
            header("Authorization", bearer(admin))
        }.andExpect {
            status { isConflict() }
        }
    }

    @Test
    fun `recovery completion attaches passkey and does not issue tokens`() {
        val admin = createUser(admin = true)
        val target = createUser()
        val recovery = passkeyRecoveryService.createRecovery(admin, target)
        val rawToken = recovery.url.substringAfterLast("/")
        val credIdBytes = ByteArray(16) { (it + 1).toByte() }
        val base64CredId = Base64.getUrlEncoder().withoutPadding().encodeToString(credIdBytes)
        webAuthnCredentialRepository.save(
            WebAuthnCredential(
                userId = target.id,
                credentialId = base64CredId,
                publicKey = ByteArray(32),
                attestationObject = ByteArray(32),
            )
        )
        val session = MockHttpSession()
        val attrName = PublicKeyCredentialCreationOptions::class.java.name + "ATTR_NAME"
        session.setAttribute(attrName, Mockito.mock(PublicKeyCredentialCreationOptions::class.java))
        val credentialRecord = ImmutableCredentialRecord.builder()
            .credentialId(Bytes(credIdBytes))
            .userEntityUserId(Bytes(uuidToBytes(target.id)))
            .publicKey(ImmutablePublicKeyCose(ByteArray(32)))
            .signatureCount(0L)
            .attestationObject(Bytes(ByteArray(32)))
            .transports(emptySet())
            .build()
        given(rpOperations.registerCredential(Mockito.any(ImmutableRelyingPartyRegistrationRequest::class.java)))
            .willReturn(credentialRecord)

        mockMvc.post("/api/auth/recovery/$rawToken/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """
                {
                  "credential": {
                    "id": "AAAA",
                    "rawId": "AAAA",
                    "type": "public-key",
                    "response": {
                      "clientDataJSON": "AAAA",
                      "attestationObject": "AAAA",
                      "transports": []
                    }
                  },
                  "label": "Recovered"
                }
            """.trimIndent()
            this.session = session
        }.andExpect {
            status { isOk() }
            jsonPath("$.success") { value(true) }
            header { doesNotExist("Set-Cookie") }
        }

        assertEquals("Recovered", webAuthnCredentialRepository.findByCredentialId(base64CredId)?.label)
        assertNotNull(passkeyRecoveryTokenRepository.findAll().first { it.userId == target.id }.consumedAt)
    }

    @Test
    fun `recovery endpoint rejects invalid token`() {
        mockMvc.get("/api/auth/recovery/not-a-real-token").andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("RECOVERY_LINK_INVALID") }
            jsonPath("$.message") { value("Recovery link is invalid or expired") }
        }
    }

    @Test
    fun `recovery endpoint reports blocked target account`() {
        val admin = createUser(admin = true)
        val target = createUser()
        val recovery = passkeyRecoveryService.createRecovery(admin, target)
        val rawToken = recovery.url.substringAfterLast("/")

        target.blockedAt = Instant.now()
        userRepository.save(target)

        mockMvc.get("/api/auth/recovery/$rawToken").andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("ACCOUNT_BLOCKED") }
            jsonPath("$.message") { value("Account is blocked") }
        }
    }
}
