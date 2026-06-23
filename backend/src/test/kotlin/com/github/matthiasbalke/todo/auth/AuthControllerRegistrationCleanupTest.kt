package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.BDDMockito.given
import org.mockito.Mockito
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.mock.web.MockHttpSession
import org.springframework.security.web.webauthn.api.Bytes
import org.springframework.security.web.webauthn.api.PublicKeyCredentialCreationOptions
import org.springframework.security.web.webauthn.api.PublicKeyCredentialUserEntity
import org.springframework.security.web.webauthn.management.ImmutableRelyingPartyRegistrationRequest
import org.springframework.security.web.webauthn.management.WebAuthnRelyingPartyOperations
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post
import java.util.UUID
import kotlin.test.assertNull

@AutoConfigureMockMvc
class AuthControllerRegistrationCleanupTest : AbstractIntegrationTest() {

    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var appSettingsService: AppSettingsService
    @MockitoBean private lateinit var rpOperations: WebAuthnRelyingPartyOperations

    @BeforeEach
    fun enableRegistration() {
        appSettingsService.setRegistrationEnabled(true)
    }

    @Test
    fun `orphaned user is deleted when passkey registration fails`() {
        // 1. Pre-insert a user (simulating what register-options does)
        val user = userRepository.save(
            User(email = "cleanup-test-${UUID.randomUUID()}@example.com", displayName = "Cleanup Test")
        )

        // 2. Build a MockHttpSession with options whose user handle = user.id
        val session = MockHttpSession()
        val attrName = PublicKeyCredentialCreationOptions::class.java.name + "ATTR_NAME"
        val mockUserEntity = Mockito.mock(PublicKeyCredentialUserEntity::class.java)
        Mockito.`when`(mockUserEntity.id).thenReturn(Bytes(uuidToBytes(user.id)))
        val mockOptions = Mockito.mock(PublicKeyCredentialCreationOptions::class.java)
        Mockito.`when`(mockOptions.user).thenReturn(mockUserEntity)
        session.setAttribute(attrName, mockOptions)

        // 3. Mock registerCredential to throw (ceremony failure)
        given(rpOperations.registerCredential(Mockito.any(ImmutableRelyingPartyRegistrationRequest::class.java)))
            .willThrow(RuntimeException("simulated WebAuthn ceremony failure"))

        // 4. POST to /api/auth/webauthn/register — must not return 200
        val body = """
            {
              "credential": {
                "id": "AAAA", "rawId": "AAAA", "type": "public-key",
                "response": { "clientDataJSON": "AAAA", "attestationObject": "AAAA", "transports": [] }
              },
              "label": null
            }
        """.trimIndent()

        try {
            mockMvc.post("/api/auth/webauthn/register") {
                contentType = MediaType.APPLICATION_JSON
                content = body
                this.session = session
            }
        } catch (_: Exception) {
            // The ceremony failure propagates — expected; we only care about DB cleanup below.
        }

        // 5. User must be gone from the database
        assertNull(
            userRepository.findByEmail(user.email),
            "Orphaned user must be deleted after failed passkey registration",
        )
    }
}
