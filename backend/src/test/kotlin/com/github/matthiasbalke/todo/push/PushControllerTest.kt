package com.github.matthiasbalke.todo.push

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.auth.JwtTokenService
import com.github.matthiasbalke.todo.auth.User
import com.github.matthiasbalke.todo.auth.UserRepository
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.util.UUID

@AutoConfigureMockMvc
class PushControllerTest : AbstractIntegrationTest() {

    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var jwtTokenService: JwtTokenService
    @Autowired private lateinit var pushSubscriptionRepository: PushSubscriptionRepository

    private val mapper = ObjectMapper()

    private fun createUser(): User =
        userRepository.save(User(email = "push-${UUID.randomUUID()}@example.com", displayName = "Push Tester"))

    private fun bearerHeader(user: User) = "Bearer ${jwtTokenService.generateAccessToken(user)}"

    private fun subscribeBody(endpoint: String = "https://push.example.com/endpoint-${UUID.randomUUID()}") =
        """{"endpoint":"$endpoint","p256dh":"dGVzdHB1YmxpY2tleQ==","auth":"dGVzdGF1dGg="}"""

    // ─── GET /api/push/vapid-public-key ──────────────────────────────────────

    @Test
    fun `GET vapid-public-key - returns 200 without authentication`() {
        mockMvc.get("/api/push/vapid-public-key")
            .andExpect {
                status { isOk() }
                jsonPath("$.publicKey") { exists() }
            }
    }

    // ─── POST /api/push/subscribe ─────────────────────────────────────────────

    @Test
    fun `POST subscribe - creates subscription and returns 201`() {
        val user = createUser()
        mockMvc.post("/api/push/subscribe") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = subscribeBody()
        }.andExpect {
            status { isCreated() }
        }
    }

    @Test
    fun `POST subscribe - idempotent re-subscribe returns 201`() {
        val user = createUser()
        val endpoint = "https://push.example.com/idempotent-${UUID.randomUUID()}"
        val body = subscribeBody(endpoint)

        mockMvc.post("/api/push/subscribe") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/push/subscribe") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect { status { isCreated() } }

        assert(pushSubscriptionRepository.findAllByUserId(user.id).size == 1)
    }

    @Test
    fun `POST subscribe - returns 4xx without authentication`() {
        mockMvc.post("/api/push/subscribe") {
            contentType = MediaType.APPLICATION_JSON
            content = subscribeBody()
        }.andExpect {
            status { is4xxClientError() }
        }
    }

    // ─── DELETE /api/push/subscribe ───────────────────────────────────────────

    @Test
    fun `DELETE subscribe - removes subscription and returns 204`() {
        val user = createUser()
        val endpoint = "https://push.example.com/delete-${UUID.randomUUID()}"

        mockMvc.post("/api/push/subscribe") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = subscribeBody(endpoint)
        }.andExpect { status { isCreated() } }

        mockMvc.delete("/api/push/subscribe") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"endpoint":"$endpoint"}"""
        }.andExpect {
            status { isNoContent() }
        }

        assert(pushSubscriptionRepository.findAllByUserId(user.id).isEmpty())
    }

    @Test
    fun `DELETE subscribe - deleting another user's subscription is a no-op`() {
        val owner = createUser()
        val other = createUser()
        val endpoint = "https://push.example.com/noop-${UUID.randomUUID()}"

        mockMvc.post("/api/push/subscribe") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = subscribeBody(endpoint)
        }.andExpect { status { isCreated() } }

        mockMvc.delete("/api/push/subscribe") {
            header("Authorization", bearerHeader(other))
            contentType = MediaType.APPLICATION_JSON
            content = """{"endpoint":"$endpoint"}"""
        }.andExpect {
            status { isNoContent() }
        }

        assert(pushSubscriptionRepository.findAllByUserId(owner.id).size == 1)
    }
}
