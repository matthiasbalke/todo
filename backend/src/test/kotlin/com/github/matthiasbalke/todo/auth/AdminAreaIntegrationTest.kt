package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.AbstractIntegrationTest
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
    @Autowired private lateinit var passkeyRecoveryTokenRepository: PasskeyRecoveryTokenRepository
    @Autowired private lateinit var passkeyRecoveryService: PasskeyRecoveryService
    @MockitoBean private lateinit var rpOperations: WebAuthnRelyingPartyOperations

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
    fun `admin can toggle runtime registration setting`() {
        val admin = createUser(admin = true)

        mockMvc.patch("/api/admin/settings/registration") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"registrationEnabled":false}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.registrationEnabled") { value(false) }
        }
        assertFalse(appSettingsService.isRegistrationEnabled())

        mockMvc.patch("/api/admin/settings/registration") {
            header("Authorization", bearer(admin))
            contentType = MediaType.APPLICATION_JSON
            content = """{"registrationEnabled":true}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.registrationEnabled") { value(true) }
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
        appSettingsService.setRegistrationEnabled(false)

        mockMvc.post("/api/admin/users/${target.id}/recovery-links") {
            header("Authorization", bearer(admin))
        }.andExpect {
            status { isCreated() }
            jsonPath("$.url") { exists() }
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
