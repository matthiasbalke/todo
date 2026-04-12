package com.github.matthiasbalke.todo.sse

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.matthiasbalke.todo.TestcontainersConfiguration
import com.github.matthiasbalke.todo.auth.JwtTokenService
import com.github.matthiasbalke.todo.auth.User
import com.github.matthiasbalke.todo.auth.UserRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.annotation.Import
import java.net.HttpURLConnection
import java.net.URI
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class)
class SseIntegrationTest {

    @LocalServerPort
    private var port: Int = 0

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var jwtTokenService: JwtTokenService

    private val mapper = ObjectMapper()

    @Test
    fun `SSE emits item_created event when item is created`() {
        val user = userRepository.save(User(email = "sse-${UUID.randomUUID()}@example.com", displayName = "SSE Test"))
        val token = jwtTokenService.generateAccessToken(user)

        // Create a list via REST
        val listId = post("/api/lists", """{"name":"SSE Test List"}""", token)
            .let { mapper.readTree(it)["id"].asText() }

        // Connect to SSE stream; server sends `: connected` comment immediately to flush headers
        val connected = CountDownLatch(1)
        val received = CountDownLatch(1)
        var receivedEventType: String? = null
        var threadError: Throwable? = null

        val thread = Thread {
            try {
                val conn = openConnection("/api/lists/$listId/events?token=$token")
                conn.setRequestProperty("Accept", "text/event-stream")
                conn.connectTimeout = 5_000
                conn.readTimeout = 5_000
                conn.connect()

                conn.inputStream.bufferedReader().use { reader ->
                    var line: String?
                    while (reader.readLine().also { line = it } != null) {
                        val l = line ?: continue
                        // `: connected` comment signals the stream is ready
                        if (l.startsWith(":")) {
                            connected.countDown()
                        }
                        if (l.startsWith("event:")) {
                            val eventType = l.removePrefix("event:").trim()
                            if (eventType == "item.created") {
                                receivedEventType = eventType
                                received.countDown()
                                return@Thread
                            }
                        }
                    }
                }
            } catch (e: Throwable) {
                threadError = e
                connected.countDown()
            }
        }
        thread.isDaemon = true
        thread.start()

        // Wait for the SSE connection to be established (server sends `: connected` comment)
        assertThat(connected.await(5, TimeUnit.SECONDS))
            .withFailMessage("SSE connection not established within 5s. Thread error: $threadError")
            .isTrue()
        assertThat(threadError).isNull()

        // Create an item — this should trigger an item.created SSE event
        post("/api/lists/$listId/items", """{"title":"Real-time Test Item"}""", token)

        // Assert that the event arrived within 1 second
        assertThat(received.await(1, TimeUnit.SECONDS))
            .withFailMessage("item.created SSE event did not arrive within 1 second")
            .isTrue()
        assertThat(receivedEventType).isEqualTo("item.created")
    }

    private fun post(path: String, body: String, token: String): String {
        val conn = openConnection(path)
        conn.requestMethod = "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("Authorization", "Bearer $token")
        conn.doOutput = true
        conn.outputStream.use { it.write(body.toByteArray()) }
        return conn.inputStream.bufferedReader().readText()
    }

    private fun openConnection(path: String): HttpURLConnection =
        URI.create("http://localhost:$port$path").toURL().openConnection() as HttpURLConnection
}
