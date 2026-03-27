package com.github.matthiasbalke.todo.auth

import io.jsonwebtoken.Claims
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Service
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.util.Date
import java.util.UUID

@Service
class JwtTokenService(private val jwtProperties: JwtProperties) {

    private val signingKey by lazy {
        Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.secret))
    }

    fun generateAccessToken(user: User): String {
        val now = Instant.now()
        val exp = now.plus(jwtProperties.accessTokenTtl)
        return Jwts.builder()
            .subject(user.id.toString())
            .claim("email", user.email)
            .claim("displayName", user.displayName)
            .id(UUID.randomUUID().toString())
            .issuer(jwtProperties.issuer)
            .audience().add(jwtProperties.audience).and()
            .issuedAt(Date.from(now))
            .notBefore(Date.from(now))
            .expiration(Date.from(exp))
            .signWith(signingKey)
            .compact()
    }

    fun generateRefreshToken(): String {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it) }
    }

    fun hashToken(raw: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest(raw.toByteArray(Charsets.UTF_8))
            .joinToString("") { "%02x".format(it) }
    }

    /**
     * Parses and validates an access token.
     * @throws JwtException on invalid/expired/tampered tokens.
     */
    fun parseAccessToken(token: String): Claims =
        Jwts.parser()
            .verifyWith(signingKey)
            .requireIssuer(jwtProperties.issuer)
            .require("aud", jwtProperties.audience)
            .build()
            .parseSignedClaims(token)
            .payload

    fun accessTokenExpiresAt(claims: Claims): Instant =
        claims.expiration.toInstant()
}
