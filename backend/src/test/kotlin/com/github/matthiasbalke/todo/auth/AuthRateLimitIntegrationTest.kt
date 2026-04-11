package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

@AutoConfigureMockMvc
@TestPropertySource(properties = ["app.security.rate-limit.capacity=10"])
class AuthRateLimitIntegrationTest : AbstractIntegrationTest() {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `11th request to auth endpoint returns 429`() {
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
