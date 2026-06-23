package com.github.matthiasbalke.todo.auth

import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant

@Service
class AuthSessionService(
    private val jwtTokenService: JwtTokenService,
    private val jwtProperties: JwtProperties,
    private val refreshTokenRepository: RefreshTokenRepository,
) {

    fun issueTokens(user: User, response: HttpServletResponse): TokenResponse {
        val accessToken = jwtTokenService.generateAccessToken(user)
        val rawRefresh = jwtTokenService.generateRefreshToken()
        val hash = jwtTokenService.hashToken(rawRefresh)
        val expiresAt = Instant.now().plus(jwtProperties.refreshTokenTtl)

        refreshTokenRepository.save(
            RefreshToken(userId = user.id, tokenHash = hash, expiresAt = expiresAt)
        )
        response.setHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie(rawRefresh).toString())

        return TokenResponse(
            accessToken = accessToken,
            user = user.toAuthDto(),
        )
    }

    fun clearRefreshCookie(response: HttpServletResponse) {
        response.setHeader(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
    }

    private fun User.toAuthDto() = AuthUserDto(id.toString(), email, displayName, admin)

    private fun refreshTokenCookie(value: String): ResponseCookie =
        ResponseCookie.from("refreshToken", value)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/api/auth")
            .maxAge(jwtProperties.refreshTokenTtl)
            .build()

    private fun clearRefreshCookie(): ResponseCookie =
        ResponseCookie.from("refreshToken", "")
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/api/auth")
            .maxAge(Duration.ZERO)
            .build()
}
