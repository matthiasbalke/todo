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
import org.springframework.security.web.webauthn.management.ImmutableRelyingPartyRegistrationRequest
import org.springframework.security.web.webauthn.management.WebAuthnRelyingPartyOperations
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post
import java.util.Base64
import java.util.UUID
import kotlin.test.assertEquals

@AutoConfigureMockMvc
class AuthControllerRegistrationLabelTest : AbstractIntegrationTest() {

    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var webAuthnCredentialRepository: WebAuthnCredentialRepository
    @MockitoBean private lateinit var rpOperations: WebAuthnRelyingPartyOperations

    @Test
    fun `register persists passkey label to database`() {
        // 1. Pre-insert User and WebAuthnCredential (no label)
        val user = userRepository.save(
            User(email = "label-test-${UUID.randomUUID()}@example.com", displayName = "Label Test")
        )
        val credIdBytes = ByteArray(16) { it.toByte() }
        val base64CredId = Base64.getUrlEncoder().withoutPadding().encodeToString(credIdBytes)
        webAuthnCredentialRepository.save(
            WebAuthnCredential(
                userId = user.id,
                credentialId = base64CredId,
                publicKey = ByteArray(32),
                attestationObject = ByteArray(32),
            )
        )

        // 2. Set up MockHttpSession with creation options so creationOptionsRepository.load() returns non-null
        val session = MockHttpSession()
        val attrName = PublicKeyCredentialCreationOptions::class.java.name + "ATTR_NAME"
        session.setAttribute(attrName, Mockito.mock(PublicKeyCredentialCreationOptions::class.java))

        // 3. Mock registerCredential to return a CredentialRecord matching the pre-inserted entities
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

        // 4. POST to /api/auth/webauthn/register with label "My MacBook"
        val body = """
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
              "label": "My MacBook"
            }
        """.trimIndent()

        mockMvc.post("/api/auth/webauthn/register") {
            contentType = MediaType.APPLICATION_JSON
            content = body
            this.session = session
        }.andExpect { status { isOk() } }

        // 5. Assert label is persisted in the database
        val credential = webAuthnCredentialRepository.findByCredentialId(base64CredId)
        assertEquals("My MacBook", credential?.label)
    }
}
