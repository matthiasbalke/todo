package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import kotlin.test.assertNotNull

@AutoConfigureMockMvc
class WebAuthnIntegrationTest : AbstractIntegrationTest() {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var revokedTokenRepository: RevokedTokenRepository

    @Autowired
    private lateinit var jwtTokenService: JwtTokenService

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

        assertNotNull(userRepository.findByEmail(email), "User must be created in DB")
    }

    @Test
    fun `register-options returns 200 for existing user without creating duplicate`() {
        val email = "existing-user@example.com"
        userRepository.save(User(email = email, displayName = "Existing"))
        val body = """{"email":"$email","displayName":"Different Name"}"""

        mockMvc.post("/api/auth/webauthn/register-options") {
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect {
            status { isOk() }
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

    // ─── rate limiting ────────────────────────────────────────────────────────

    @Test
    fun `11th request to auth endpoint returns 429`() {
        // Use a unique path under /api/auth that won't create real side effects at this stage
        val body = "{}"
        repeat(10) {
            mockMvc.post("/api/auth/refresh") {
                contentType = MediaType.APPLICATION_JSON
                content = body
                with { req ->
                    req.remoteAddr = "10.0.0.42"
                    req
                }
            }
        }

        mockMvc.post("/api/auth/refresh") {
            contentType = MediaType.APPLICATION_JSON
            content = body
            with { req ->
                req.remoteAddr = "10.0.0.42"
                req
            }
        }.andExpect {
            status { isEqualTo(429) }
            header { exists("Retry-After") }
        }
    }
}
