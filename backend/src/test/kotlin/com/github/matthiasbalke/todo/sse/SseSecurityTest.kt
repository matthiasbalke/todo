package com.github.matthiasbalke.todo.sse

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import jakarta.servlet.DispatcherType
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.mock.web.MockFilterChain
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.web.FilterChainProxy
import java.util.UUID

class SseSecurityTest : AbstractIntegrationTest() {

    @Autowired private lateinit var filterChainProxy: FilterChainProxy

    @Test
    fun `async dispatch to SSE endpoint is permitted and does not cause AuthorizationDeniedException`() {
        // Simulate the ASYNC dispatch that occurs when the SSE connection is closed.
        // JwtAuthenticationFilter skips ASYNC dispatches (OncePerRequestFilter default),
        // so SecurityContext is empty.  Without the fix, AuthorizationFilter denies
        // the unauthenticated ASYNC dispatch → 401/403.
        val request = MockHttpServletRequest("GET", "/api/lists/${UUID.randomUUID()}/events")
        request.dispatcherType = DispatcherType.ASYNC
        request.addHeader("Accept", MediaType.TEXT_EVENT_STREAM_VALUE)

        val response = MockHttpServletResponse()

        filterChainProxy.doFilter(request, response, MockFilterChain())

        // Before fix: AuthorizationFilter blocks ASYNC dispatch → 401/403
        // After  fix: dispatcherTypeMatchers(ASYNC).permitAll() passes it through → 200
        assertThat(response.status)
            .withFailMessage("ASYNC dispatch must not be blocked by the security filter chain (got HTTP ${response.status})")
            .isNotIn(401, 403)
    }
}
