package com.github.matthiasbalke.todo.auth

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

@Component
class EmailVerificationRequiredFilter(
    private val userRepository: UserRepository,
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val principal = SecurityContextHolder.getContext().authentication?.principal
        val userId = principal as? UUID
        if (userId == null || allowedPath(request)) {
            filterChain.doFilter(request, response)
            return
        }

        val user = userRepository.findById(userId).orElse(null)
        if (user?.validatedAt == null) {
            response.status = HttpServletResponse.SC_FORBIDDEN
            response.contentType = MediaType.APPLICATION_JSON_VALUE
            response.writer.write("""{"code":"EMAIL_VERIFICATION_REQUIRED","message":"Email verification is required."}""")
            return
        }

        filterChain.doFilter(request, response)
    }

    private fun allowedPath(request: HttpServletRequest): Boolean {
        val method = request.method
        val path = request.requestURI

        if (path == "/api/auth/logout") return true
        if (path == "/api/auth/refresh") return true
        if (path == "/api/users/me" && method == HttpMethod.GET.name()) return true
        if (path == "/api/users/me/verification") return true
        if (path == "/api/users/me/verification/email") return true
        if (path == "/api/users/me/verification/pending-email" && method == HttpMethod.DELETE.name()) return true

        return false
    }
}
