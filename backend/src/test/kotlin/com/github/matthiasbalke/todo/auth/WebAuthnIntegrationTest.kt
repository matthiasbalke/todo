package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.mock.web.MockHttpSession
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.util.Base64
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

@AutoConfigureMockMvc
class WebAuthnIntegrationTest : AbstractIntegrationTest() {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var publicKeyCredentialUserEntityRepository:
        org.springframework.security.web.webauthn.management.PublicKeyCredentialUserEntityRepository

    @Autowired
    private lateinit var webAuthnCredentialRepository: WebAuthnCredentialRepository

    @Autowired
    private lateinit var revokedTokenRepository: RevokedTokenRepository

    @Autowired
    private lateinit var jwtTokenService: JwtTokenService

    @Autowired
    private lateinit var appSettingsService: AppSettingsService

    @BeforeEach
    fun enableRegistration() {
        appSettingsService.setRegistrationEnabled(true)
    }

    // ─── config ───────────────────────────────────────────────────────────────

    @Test
    fun `config returns registrationEnabled true by default`() {
        mockMvc.get("/api/auth/config").andExpect {
            status { isOk() }
            content { contentType(MediaType.APPLICATION_JSON) }
            jsonPath("$.registrationEnabled") { value(true) }
        }
    }

    // ─── register-options ────────────────────────────────────────────────────

    @Test
    fun `register-options returns 200 and creates user in DB`() {
        val email = "register-options@example.com"
        val body = """{"email":"$email","displayName":"Test User"}"""

        mockMvc.post("/api/auth/webauthn/register-options") {
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect {
            status { isOk() }
            content { contentType(MediaType.APPLICATION_JSON) }
            jsonPath("$.challenge") { exists() }
            jsonPath("$.rp.id") { exists() }
            jsonPath("$.user.name") { value(email) }
            // residentKey: required enforced
            jsonPath("$.authenticatorSelection.residentKey") { value("required") }
            jsonPath("$.authenticatorSelection.userVerification") { value("required") }
        }

        assertNotNull(userRepository.findByEmailIdentity(email), "User must be created in DB")
    }

    @Test
    fun `register-options returns 409 with EMAIL_ALREADY_REGISTERED for email with existing credential`() {
        val email = "existing-user-with-cred@example.com"
        val user = userRepository.save(User(email = email, displayName = "Existing"))
        // Attach a credential so this is a fully registered account (not an orphan)
        val credId = Base64.getUrlEncoder().withoutPadding().encodeToString(UUID.randomUUID().toString().toByteArray())
        webAuthnCredentialRepository.save(
            WebAuthnCredential(
                userId = user.id,
                credentialId = credId,
                publicKey = ByteArray(32),
                attestationObject = ByteArray(32),
            )
        )
        val body = """{"email":"$email","displayName":"Different Name"}"""

        mockMvc.post("/api/auth/webauthn/register-options") {
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect {
            status { isEqualTo(409) }
            jsonPath("$.code") { value("EMAIL_ALREADY_REGISTERED") }
            jsonPath("$.message") { value("This email address is already registered.") }
        }
    }

    @Test
    fun `register-options rejects duplicate email with different casing and whitespace`() {
        val email = "Existing-${UUID.randomUUID()}@Example.com"
        val user = userRepository.save(User(email = email, displayName = "Existing"))
        val credId = Base64.getUrlEncoder().withoutPadding().encodeToString(UUID.randomUUID().toString().toByteArray())
        webAuthnCredentialRepository.save(
            WebAuthnCredential(
                userId = user.id,
                credentialId = credId,
                publicKey = ByteArray(32),
                attestationObject = ByteArray(32),
            )
        )
        val requestedEmail = "  ${email.lowercase()}  "
        val body = """{"email":"$requestedEmail","displayName":"Different Name"}"""

        mockMvc.post("/api/auth/webauthn/register-options") {
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect {
            status { isEqualTo(409) }
            jsonPath("$.code") { value("EMAIL_ALREADY_REGISTERED") }
        }

        assertEquals(1, userRepository.findAll().count { it.email.equals(email, ignoreCase = true) })
    }

    @Test
    fun `register-options deletes orphaned user and returns 200 when email exists but has no credential`() {
        // Simulate a previous registration attempt that saved the user but the
        // passkey ceremony was never completed (e.g. the browser dialog was cancelled).
        val email = "orphan-user@example.com"
        val orphan = userRepository.save(User(email = email, displayName = "Orphan"))
        val body = """{"email":"$email","displayName":"Orphan"}"""

        mockMvc.post("/api/auth/webauthn/register-options") {
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect {
            status { isOk() }
            jsonPath("$.challenge") { exists() }
        }

        // Orphan is gone; a fresh user row was created
        assertNull(userRepository.findById(orphan.id).orElse(null), "Orphaned user must be deleted")
        assertNotNull(userRepository.findByEmailIdentity(email), "Fresh user must be created for the retry")
    }

    @Test
    fun `passkey user lookup resolves email with different casing and whitespace`() {
        val user = userRepository.save(User(email = "Passkey-${UUID.randomUUID()}@Example.com", displayName = "Passkey User"))

        val resolved = publicKeyCredentialUserEntityRepository.findByUsername("  ${user.email.lowercase()}  ")

        assertNotNull(resolved)
        assertEquals(user.email, resolved.name)
    }

    // ─── login ────────────────────────────────────────────────────────────────

    @Test
    fun `login returns 404 with PASSKEY_NOT_REGISTERED for unknown credential`() {
        val loginOptionsSession = mockMvc.post("/api/auth/webauthn/login-options") {
            contentType = MediaType.APPLICATION_JSON
            content = "{}"
        }.andExpect { status { isOk() } }
         .andReturn().request.session

        val unknownCredId = Base64.getUrlEncoder().withoutPadding()
            .encodeToString("unknown-credential-id".toByteArray())
        val body = """{"id":"$unknownCredId","rawId":"$unknownCredId",
            "response":{"clientDataJSON":"e30","authenticatorData":"e30","signature":"e30"},
            "type":"public-key"}"""

        mockMvc.post("/api/auth/webauthn/login") {
            contentType = MediaType.APPLICATION_JSON
            content = body
            session = loginOptionsSession as MockHttpSession
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("PASSKEY_NOT_REGISTERED") }
            jsonPath("$.message") { value("This passkey is not registered. Please create an account first.") }
        }
    }

    // ─── login-options ────────────────────────────────────────────────────────

    @Test
    fun `login-options returns 200 with empty allowCredentials`() {
        mockMvc.post("/api/auth/webauthn/login-options") {
            contentType = MediaType.APPLICATION_JSON
            content = "{}"
        }.andExpect {
            status { isOk() }
            content { contentType(MediaType.APPLICATION_JSON) }
            jsonPath("$.challenge") { exists() }
            // empty allowCredentials = discoverable credentials (no email enumeration)
            jsonPath("$.allowCredentials") { isArray() }
            jsonPath("$.allowCredentials.length()") { value(0) }
            jsonPath("$.userVerification") { value("required") }
        }
    }

    // ─── refresh ─────────────────────────────────────────────────────────────

    @Test
    fun `refresh returns 401 when no cookie present`() {
        mockMvc.post("/api/auth/refresh") {
            contentType = MediaType.APPLICATION_JSON
            content = "{}"
        }.andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    fun `refresh returns 401 for unknown refresh token`() {
        mockMvc.post("/api/auth/refresh") {
            contentType = MediaType.APPLICATION_JSON
            content = "{}"
            cookie(jakarta.servlet.http.Cookie("refreshToken", "unknown-token-value"))
        }.andExpect {
            status { isUnauthorized() }
        }
    }

    // ─── logout ──────────────────────────────────────────────────────────────

    @Test
    fun `logout returns 204 and revokes access token jti`() {
        val user = userRepository.save(User(email = "logout@example.com", displayName = "Logout User"))
        val accessToken = jwtTokenService.generateAccessToken(user)

        mockMvc.post("/api/auth/logout") {
            header("Authorization", "Bearer $accessToken")
        }.andExpect {
            status { isNoContent() }
        }

        val claims = jwtTokenService.parseAccessToken(accessToken)
        val jti = claims.id
        assertNotNull(jti)
        assert(revokedTokenRepository.existsByJti(jti)) {
            "JTI should be in revoked_tokens after logout"
        }
    }

    @Test
    fun `request with revoked token returns 401`() {
        val user = userRepository.save(User(email = "revoked@example.com", displayName = "Revoked User"))
        val accessToken = jwtTokenService.generateAccessToken(user)

        // Logout first to revoke
        mockMvc.post("/api/auth/logout") {
            header("Authorization", "Bearer $accessToken")
        }.andExpect { status { isNoContent() } }

        // Then use the same token for an authenticated endpoint
        mockMvc.get("/api/users/me") {
            header("Authorization", "Bearer $accessToken")
        }.andExpect {
            status { isUnauthorized() }
        }
    }

}
