package com.github.matthiasbalke.todo.auth

import io.jsonwebtoken.JwtException
import org.junit.jupiter.api.assertThrows
import java.time.Duration
import java.time.Instant
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class JwtTokenServiceTest {

    private val properties = JwtProperties(
        // 32-byte base64-encoded key (minimum for HS256)
        secret = "dGVzdC1zZWNyZXQta2V5LXRoYXQtaXMtbG9uZy1lbm91Z2gtZm9yLUhTMjU2",
        issuer = "todo-app-test",
        audience = "todo-api-test",
        accessTokenTtl = Duration.ofMinutes(15),
        refreshTokenTtl = Duration.ofDays(30),
    )

    private val service = JwtTokenService(properties)

    private val testUser = User(
        id = UUID.fromString("00000000-0000-0000-0000-000000000001"),
        email = "test@example.com",
        displayName = "Test User",
    )

    @Test
    fun `generateAccessToken contains required claims`() {
        val token = service.generateAccessToken(testUser)
        val claims = service.parseAccessToken(token)

        assertEquals(testUser.id.toString(), claims.subject)
        assertEquals(testUser.email, claims["email"])
        assertEquals(testUser.displayName, claims["displayName"])
        assertNotNull(claims.id, "jti must be present")
        assertEquals(properties.issuer, claims.issuer)
        assertTrue(claims.audience.contains(properties.audience))
        assertNotNull(claims.issuedAt)
        assertNotNull(claims.expiration)
        assertNotNull(claims.notBefore)
    }

    @Test
    fun `parseAccessToken succeeds on valid token`() {
        val token = service.generateAccessToken(testUser)
        val claims = service.parseAccessToken(token)
        assertEquals(testUser.id.toString(), claims.subject)
    }

    @Test
    fun `parseAccessToken throws on expired token`() {
        val expiredService = JwtTokenService(
            properties.copy(accessTokenTtl = Duration.ofSeconds(-1))
        )
        val token = expiredService.generateAccessToken(testUser)
        assertThrows<JwtException> { service.parseAccessToken(token) }
    }

    @Test
    fun `parseAccessToken throws on tampered signature`() {
        val token = service.generateAccessToken(testUser)
        val tampered = token.dropLast(4) + "XXXX"
        assertThrows<JwtException> { service.parseAccessToken(tampered) }
    }

    @Test
    fun `parseAccessToken throws when issuer does not match`() {
        val wrongService = JwtTokenService(properties.copy(issuer = "other-issuer"))
        val token = wrongService.generateAccessToken(testUser)
        assertThrows<JwtException> { service.parseAccessToken(token) }
    }

    @Test
    fun `parseAccessToken throws when audience does not match`() {
        val wrongService = JwtTokenService(properties.copy(audience = "other-audience"))
        val token = wrongService.generateAccessToken(testUser)
        assertThrows<JwtException> { service.parseAccessToken(token) }
    }

    @Test
    fun `accessTokenExpiresAt returns expiration from claims`() {
        val before = Instant.now()
        val token = service.generateAccessToken(testUser)
        val claims = service.parseAccessToken(token)
        val exp = service.accessTokenExpiresAt(claims)
        assertTrue(exp.isAfter(before.plus(Duration.ofMinutes(14))))
        assertTrue(exp.isBefore(before.plus(Duration.ofMinutes(16))))
    }

    @Test
    fun `hashToken is deterministic and produces SHA-256 hex length`() {
        val raw = "some-refresh-token-value"
        val hash1 = service.hashToken(raw)
        val hash2 = service.hashToken(raw)
        assertEquals(hash1, hash2)
        assertEquals(64, hash1.length)
        assertTrue(hash1.all { it.isDigit() || it in 'a'..'f' })
    }

    @Test
    fun `generateRefreshToken produces 64 hex characters`() {
        val token = service.generateRefreshToken()
        assertEquals(64, token.length)
        assertTrue(token.all { it.isDigit() || it in 'a'..'f' })
    }

    @Test
    fun `two refresh tokens are distinct`() {
        val t1 = service.generateRefreshToken()
        val t2 = service.generateRefreshToken()
        assertFalse(t1 == t2)
    }
}
