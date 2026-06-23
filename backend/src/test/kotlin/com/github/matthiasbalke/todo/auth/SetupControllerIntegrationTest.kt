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
import org.springframework.test.context.jdbc.Sql
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.util.Base64
import java.util.UUID
import kotlin.test.assertTrue

@AutoConfigureMockMvc
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
        }
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
        val session = MockHttpSession()
        val attrName = PublicKeyCredentialCreationOptions::class.java.name + "ATTR_NAME"
        val mockUserEntity = Mockito.mock(PublicKeyCredentialUserEntity::class.java)
        Mockito.`when`(mockUserEntity.id).thenReturn(Bytes(uuidToBytes(user.id)))
        val mockOptions = Mockito.mock(PublicKeyCredentialCreationOptions::class.java)
        Mockito.`when`(mockOptions.user).thenReturn(mockUserEntity)
        session.setAttribute(attrName, mockOptions)
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
                  "label": "Admin key"
                }
            """.trimIndent()
            this.session = session
        }.andExpect {
            status { isOk() }
            jsonPath("$.user.admin") { value(true) }
            jsonPath("$.accessToken") { exists() }
        }

        assertTrue(userRepository.findById(user.id).orElseThrow().admin)
    }
}
