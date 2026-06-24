package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import org.junit.jupiter.api.Test
import org.mockito.BDDMockito.given
import org.mockito.Mockito
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.mock.web.MockHttpSession
import org.springframework.security.web.webauthn.api.Bytes
import org.springframework.security.web.webauthn.api.ImmutableCredentialRecord
import org.springframework.security.web.webauthn.api.ImmutablePublicKeyCose
import org.springframework.security.web.webauthn.api.PublicKeyCredentialCreationOptions
import org.springframework.security.web.webauthn.api.PublicKeyCredentialUserEntity
import org.springframework.security.web.webauthn.management.ImmutableRelyingPartyRegistrationRequest
import org.springframework.security.web.webauthn.management.WebAuthnRelyingPartyOperations
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.context.TestPropertySource
import org.springframework.test.context.jdbc.Sql
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.util.Base64
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@AutoConfigureMockMvc
@TestPropertySource(properties = ["app.setup.secret=test-setup-secret"])
@Sql(
    statements = [
        "TRUNCATE TABLE users, app_settings CASCADE",
    ],
    executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD,
)
class SetupControllerIntegrationTest : AbstractIntegrationTest() {

    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var webAuthnCredentialRepository: WebAuthnCredentialRepository
    @MockitoBean private lateinit var rpOperations: WebAuthnRelyingPartyOperations

    @Test
    fun `setup status is required on empty database`() {
        mockMvc.get("/api/setup").andExpect {
            status { isOk() }
            jsonPath("$.setupRequired") { value(true) }
            jsonPath("$.setupSecret") { doesNotExist() }
        }
    }

    @Test
    fun `register-options rejects missing setup secret without creating user`() {
        mockMvc.post("/api/setup/webauthn/register-options") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"setup-missing@example.com","displayName":"Setup User"}"""
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("SETUP_SECRET_INVALID") }
        }

        assertEquals(0, userRepository.count())
    }

    @Test
    fun `register-options rejects invalid setup secret without creating user`() {
        mockMvc.post("/api/setup/webauthn/register-options") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"setup-invalid@example.com","displayName":"Setup User","setupSecret":"wrong"}"""
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("SETUP_SECRET_INVALID") }
        }

        assertEquals(0, userRepository.count())
    }

    @Test
    fun `setup endpoints preserve not required response when admin exists`() {
        userRepository.save(User(email = "admin-${UUID.randomUUID()}@example.com", displayName = "Admin", admin = true))

        mockMvc.post("/api/setup/webauthn/register-options") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"new-admin@example.com","displayName":"New Admin","setupSecret":"wrong"}"""
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("SETUP_NOT_REQUIRED") }
        }

        mockMvc.post("/api/setup/webauthn/register") {
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
                  "setupSecret": "wrong",
                  "label": "Admin key"
                }
            """.trimIndent()
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("SETUP_NOT_REQUIRED") }
        }
    }

    @Test
    fun `setup completion rejects missing setup secret without promoting user`() {
        val user = userRepository.save(
            User(email = "setup-${UUID.randomUUID()}@example.com", displayName = "Setup User")
        )
        val session = setupSessionForUser(user.id)

        mockMvc.post("/api/setup/webauthn/register") {
            contentType = MediaType.APPLICATION_JSON
            content = setupCompleteBody()
            this.session = session
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("SETUP_SECRET_INVALID") }
        }

        assertFalse(userRepository.findById(user.id).orElseThrow().admin)
    }

    @Test
    fun `setup completion promotes existing non-admin user to first admin`() {
        val user = userRepository.save(
            User(email = "setup-${UUID.randomUUID()}@example.com", displayName = "Setup User")
        )
        val credIdBytes = ByteArray(16) { (it + 5).toByte() }
        val base64CredId = Base64.getUrlEncoder().withoutPadding().encodeToString(credIdBytes)
        webAuthnCredentialRepository.save(
            WebAuthnCredential(
                userId = user.id,
                credentialId = base64CredId,
                publicKey = ByteArray(32),
                attestationObject = ByteArray(32),
            )
        )
        val session = setupSessionForUser(user.id)
        val credentialRecord = ImmutableCredentialRecord.builder()
            .credentialId(Bytes(credIdBytes))
            .userEntityUserId(Bytes(uuidToBytes(user.id)))
            .publicKey(ImmutablePublicKeyCose(ByteArray(32)))
            .signatureCount(0L)
            .attestationObject(Bytes(ByteArray(32)))
            .transports(emptySet())
            .build()
        given(rpOperations.registerCredential(Mockito.any(ImmutableRelyingPartyRegistrationRequest::class.java)))
            .willReturn(credentialRecord)

        mockMvc.post("/api/setup/webauthn/register") {
            contentType = MediaType.APPLICATION_JSON
            content = setupCompleteBody(setupSecret = "test-setup-secret")
            this.session = session
        }.andExpect {
            status { isOk() }
            jsonPath("$.user.admin") { value(true) }
            jsonPath("$.accessToken") { exists() }
        }

        assertTrue(userRepository.findById(user.id).orElseThrow().admin)
    }

    private fun setupSessionForUser(userId: UUID): MockHttpSession {
        val session = MockHttpSession()
        val attrName = PublicKeyCredentialCreationOptions::class.java.name + "ATTR_NAME"
        val mockUserEntity = Mockito.mock(PublicKeyCredentialUserEntity::class.java)
        Mockito.`when`(mockUserEntity.id).thenReturn(Bytes(uuidToBytes(userId)))
        val mockOptions = Mockito.mock(PublicKeyCredentialCreationOptions::class.java)
        Mockito.`when`(mockOptions.user).thenReturn(mockUserEntity)
        session.setAttribute(attrName, mockOptions)
        return session
    }

    private fun setupCompleteBody(setupSecret: String? = null): String {
        val secretJson = setupSecret?.let { ",\"setupSecret\":\"$it\"" } ?: ""
        return """
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
              }$secretJson,
              "label": "Admin key"
            }
        """.trimIndent()
    }
}
