package com.github.matthiasbalke.todo.auth

import io.github.bucket4j.Bandwidth
import io.github.bucket4j.Bucket
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpMethod
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Duration
import java.util.concurrent.ConcurrentHashMap

@Component
class AuthRateLimitFilter(
    @Value("\${app.security.rate-limit.capacity:50}") private val capacity: Long,
    @Value("\${app.security.rate-limit.window-minutes:1}") private val windowMinutes: Long,
) : OncePerRequestFilter() {

    private val buckets = ConcurrentHashMap<String, Bucket>()

    override fun shouldNotFilter(request: HttpServletRequest): Boolean =
        !isSensitiveEndpoint(request)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val ip = request.remoteAddr
        val bucket = buckets.computeIfAbsent(ip) { newBucket() }
        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response)
        } else {
            response.status = 429
            response.setHeader("Retry-After", "60")
            response.writer.write("Too many requests")
        }
    }

    private fun newBucket(): Bucket =
        Bucket.builder()
            .addLimit(Bandwidth.builder().capacity(capacity).refillGreedy(capacity, Duration.ofMinutes(windowMinutes)).build())
            .build()

    private fun isSensitiveEndpoint(request: HttpServletRequest): Boolean {
        if (request.requestURI.startsWith("/api/auth")) return true
        if (request.requestURI.startsWith("/api/setup")) return true
        return request.method == HttpMethod.POST.name() &&
            MEMBER_INVITE_PATH.matches(request.requestURI)
    }

    companion object {
        private val MEMBER_INVITE_PATH = Regex("""^/api/lists/[^/]+/members$""")
    }
}
