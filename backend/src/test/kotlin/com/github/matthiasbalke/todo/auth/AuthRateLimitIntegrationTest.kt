package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.lists.ListMembership
import com.github.matthiasbalke.todo.lists.ListMembershipRepository
import com.github.matthiasbalke.todo.lists.ListRepository
import com.github.matthiasbalke.todo.lists.ListRole
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
    @Autowired
    private lateinit var userRepository: UserRepository
    @Autowired
    private lateinit var listRepository: ListRepository
    @Autowired
    private lateinit var listMembershipRepository: ListMembershipRepository
    @Autowired
    private lateinit var jwtTokenService: JwtTokenService

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

    @Test
    fun `11th request to setup endpoint returns 429`() {
        repeat(10) {
            mockMvc.post("/api/setup/webauthn/register-options") {
                contentType = MediaType.APPLICATION_JSON
                content = "{}"
                with { req ->
                    req.remoteAddr = "10.0.0.43"
                    req
                }
            }
        }

        mockMvc.post("/api/setup/webauthn/register-options") {
            contentType = MediaType.APPLICATION_JSON
            content = "{}"
            with { req ->
                req.remoteAddr = "10.0.0.43"
                req
            }
        }.andExpect {
            status { isEqualTo(429) }
            header { exists("Retry-After") }
        }
    }

    @Test
    fun `11th member invite attempt returns 429`() {
        val owner = userRepository.save(User(email = "owner-rate-limit@example.com", displayName = "Owner"))
        val list = listRepository.save(com.github.matthiasbalke.todo.lists.List(name = "Shared"))
        listMembershipRepository.save(ListMembership(listId = list.id, userId = owner.id, role = ListRole.OWNER))
        val bearer = "Bearer ${jwtTokenService.generateAccessToken(owner)}"

        repeat(10) { index ->
            mockMvc.post("/api/lists/${list.id}/members") {
                header("Authorization", bearer)
                contentType = MediaType.APPLICATION_JSON
                content = """{"email":"missing-$index@example.com","role":"VIEWER"}"""
                with { req ->
                    req.remoteAddr = "10.0.0.44"
                    req
                }
            }
        }

        mockMvc.post("/api/lists/${list.id}/members") {
            header("Authorization", bearer)
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"missing-final@example.com","role":"VIEWER"}"""
            with { req ->
                req.remoteAddr = "10.0.0.44"
                req
            }
        }.andExpect {
            status { isEqualTo(429) }
            header { exists("Retry-After") }
        }
    }
}
