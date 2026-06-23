package com.github.matthiasbalke.todo.auth

import io.jsonwebtoken.JwtException
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

@Component
class JwtAuthenticationFilter(
    private val jwtTokenService: JwtTokenService,
    private val revokedTokenRepository: RevokedTokenRepository,
    private val userRepository: UserRepository,
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val token = extractBearerToken(request)
        if (token != null) {
            try {
                val claims = jwtTokenService.parseAccessToken(token)
                val jti = claims.id
                if (jti != null && revokedTokenRepository.existsByJti(jti)) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token revoked")
                    return
                }
                val userId = UUID.fromString(claims.subject)
                val user = userRepository.findById(userId).orElse(null)
                if (user == null) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "User not found")
                    return
                }
                if (user.blockedAt != null) {
                    response.status = HttpServletResponse.SC_FORBIDDEN
                    response.contentType = MediaType.APPLICATION_JSON_VALUE
                    response.writer.write("""{"code":"ACCOUNT_BLOCKED","message":"Account is blocked"}""")
                    return
                }
                val authorities = if (user.admin) {
                    listOf(org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))
                } else {
                    emptyList()
                }
                val auth = UsernamePasswordAuthenticationToken(userId, null, authorities)
                SecurityContextHolder.getContext().authentication = auth
            } catch (_: JwtException) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token")
                return
            }
        }
        filterChain.doFilter(request, response)
    }

    private fun extractBearerToken(request: HttpServletRequest): String? {
        val header = request.getHeader("Authorization")
        if (header != null && header.startsWith("Bearer ")) {
            return header.removePrefix("Bearer ")
        }
        // Fallback for EventSource, which cannot set custom headers
        return request.getParameter("token")
    }
}
