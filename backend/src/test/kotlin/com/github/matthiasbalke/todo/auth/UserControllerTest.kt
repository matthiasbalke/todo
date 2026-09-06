package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.lists.List as TodoList
import com.github.matthiasbalke.todo.lists.ListMembership
import com.github.matthiasbalke.todo.lists.ListMembershipRepository
import com.github.matthiasbalke.todo.lists.ListRepository
import com.github.matthiasbalke.todo.lists.ListRole
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

@AutoConfigureMockMvc
class UserControllerTest : AbstractIntegrationTest() {

    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var webAuthnCredentialRepository: WebAuthnCredentialRepository
    @Autowired private lateinit var listRepository: ListRepository
    @Autowired private lateinit var listMembershipRepository: ListMembershipRepository
    @Autowired private lateinit var jwtTokenService: JwtTokenService

    private fun createUser(email: String = "user-${UUID.randomUUID()}@example.com"): User =
        userRepository.save(User(email = email, displayName = "Test User"))

    private fun bearerHeader(user: User) = "Bearer ${jwtTokenService.generateAccessToken(user)}"

    private fun createPasskey(user: User, label: String? = null): WebAuthnCredential =
        webAuthnCredentialRepository.save(
            WebAuthnCredential(
                userId = user.id,
                credentialId = "cred-${UUID.randomUUID()}",
                publicKey = ByteArray(32),
                attestationObject = ByteArray(32),
                label = label,
            )
        )

    // ─── GET /api/users/me ────────────────────────────────────────────────────

    @Test
    fun `GET me - returns profile for authenticated user`() {
        val user = createUser()
        mockMvc.get("/api/users/me") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(user.id.toString()) }
            jsonPath("$.email") { value(user.email) }
            jsonPath("$.displayName") { value(user.displayName) }
            jsonPath("$.timeZone") { value("UTC") }
            jsonPath("$.timeZoneInitialized") { value(false) }
            jsonPath("$.todayViewEnabled") { value(true) }
        }
    }

    @Test
    fun `PUT preferences - persists valid timezone and Today setting`() {
        val user = createUser()
        mockMvc.put("/api/users/me/preferences") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"timeZone":"Europe/Berlin","todayViewEnabled":false}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.timeZone") { value("Europe/Berlin") }
            jsonPath("$.timeZoneInitialized") { value(true) }
            jsonPath("$.todayViewEnabled") { value(false) }
        }
    }

    @Test
    fun `PUT preferences - accepts explicit UTC selection`() {
        val user = createUser()
        mockMvc.put("/api/users/me/preferences") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"timeZone":"UTC","todayViewEnabled":true}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.timeZone") { value("UTC") }
            jsonPath("$.timeZoneInitialized") { value(true) }
        }
    }

    @Test
    fun `PUT preferences - rejects invalid timezone without changing state`() {
        val user = createUser()
        mockMvc.put("/api/users/me/preferences") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"timeZone":"Not/A_Zone","todayViewEnabled":false}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("INVALID_TIME_ZONE") }
        }
        val unchanged = userRepository.findById(user.id).orElseThrow()
        assert(unchanged.timeZone == "UTC")
        assertFalse(unchanged.timeZoneInitialized)
        assertTrue(unchanged.todayViewEnabled)
    }

    @Test
    fun `GET me - returns 4xx without token`() {
        mockMvc.get("/api/users/me").andExpect {
            status { is4xxClientError() }
        }
    }

    // ─── PUT /api/users/me ────────────────────────────────────────────────────

    @Test
    fun `PUT me - updates displayName`() {
        val user = createUser()
        mockMvc.put("/api/users/me") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"displayName":"New Name","email":"${user.email}"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.displayName") { value("New Name") }
        }
    }

    @Test
    fun `PUT me - updates email`() {
        val user = createUser()
        val newEmail = "new-${UUID.randomUUID()}@example.com"
        mockMvc.put("/api/users/me") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"displayName":"${user.displayName}","email":"$newEmail"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.email") { value(newEmail) }
        }
    }

    @Test
    fun `PUT me - rejects blank displayName`() {
        val user = createUser()
        mockMvc.put("/api/users/me") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"displayName":"   ","email":"${user.email}"}"""
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `PUT me - rejects duplicate email with 409`() {
        val user1 = createUser("Duplicate-${UUID.randomUUID()}@Example.com")
        val user2 = createUser()
        mockMvc.put("/api/users/me") {
            header("Authorization", bearerHeader(user2))
            contentType = MediaType.APPLICATION_JSON
            content = """{"displayName":"${user2.displayName}","email":"  ${user1.email.lowercase()}  "}"""
        }.andExpect {
            status { isEqualTo(409) }
            jsonPath("$.code") { value("EMAIL_IN_USE") }
        }

        assertEquals(user2.email, userRepository.findById(user2.id).orElseThrow().email)
    }

    @Test
    fun `PUT me - allows changing only own email casing and stores trimmed email`() {
        val user = createUser("Own-${UUID.randomUUID()}@Example.com")
        val updatedEmail = user.email.uppercase()

        mockMvc.put("/api/users/me") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"displayName":"${user.displayName}","email":"  $updatedEmail  "}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.email") { value(updatedEmail) }
        }

        assertEquals(updatedEmail, userRepository.findById(user.id).orElseThrow().email)
    }

    // ─── GET /api/users/me/passkeys ───────────────────────────────────────────

    @Test
    fun `GET me passkeys - lists credentials`() {
        val user = createUser()
        val passkey = createPasskey(user, "My Laptop")
        mockMvc.get("/api/users/me/passkeys") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(passkey.id.toString()) }
            jsonPath("$[0].label") { value("My Laptop") }
            jsonPath("$[0].createdAt") { exists() }
        }
    }

    @Test
    fun `GET me passkeys - returns only caller credentials`() {
        val user = createUser()
        val other = createUser()
        createPasskey(user)
        createPasskey(other)
        val responseBody = mockMvc.get("/api/users/me/passkeys") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isOk() }
        }.andReturn().response.contentAsString
        // Only one passkey should belong to this user
        val count = responseBody.split("\"createdAt\"").size - 1
        assert(count == 1) { "Expected 1 passkey, got $count" }
    }

    // ─── DELETE /api/users/me/passkeys/{id} ───────────────────────────────────

    @Test
    fun `DELETE me passkeys - removes credential when multiple exist`() {
        val user = createUser()
        val passkey1 = createPasskey(user)
        createPasskey(user)

        mockMvc.delete("/api/users/me/passkeys/${passkey1.id}") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isNoContent() }
        }

        assertFalse(webAuthnCredentialRepository.existsById(passkey1.id))
    }

    @Test
    fun `DELETE me passkeys - returns 409 with LAST_PASSKEY when only one credential`() {
        val user = createUser()
        val passkey = createPasskey(user)

        mockMvc.delete("/api/users/me/passkeys/${passkey.id}") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isEqualTo(409) }
            jsonPath("$.code") { value("LAST_PASSKEY") }
        }
    }

    @Test
    fun `DELETE me passkeys - cannot remove another user passkey`() {
        val user = createUser()
        val other = createUser()
        createPasskey(user)
        val otherPasskey = createPasskey(other)
        createPasskey(other)

        mockMvc.delete("/api/users/me/passkeys/${otherPasskey.id}") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isNotFound() }
        }
    }

    // ─── GET /api/users/me/deletion-preview ───────────────────────────────────

    @Test
    fun `GET me deletion-preview - returns correct split of sole-owned vs shared lists`() {
        val user = createUser()
        val otherOwner = createUser()

        val soleList = listRepository.save(TodoList(name = "Sole List"))
        listMembershipRepository.save(ListMembership(listId = soleList.id, userId = user.id, role = ListRole.OWNER))

        val sharedList = listRepository.save(TodoList(name = "Shared List"))
        listMembershipRepository.save(ListMembership(listId = sharedList.id, userId = user.id, role = ListRole.OWNER))
        listMembershipRepository.save(ListMembership(listId = sharedList.id, userId = otherOwner.id, role = ListRole.OWNER))

        mockMvc.get("/api/users/me/deletion-preview") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isOk() }
            jsonPath("$.listsToDelete[0].name") { value("Sole List") }
            jsonPath("$.listsToLeave[0].name") { value("Shared List") }
        }
    }

    // ─── DELETE /api/users/me ─────────────────────────────────────────────────

    @Test
    fun `DELETE me - deletes sole-owned list and user record`() {
        val user = createUser()

        val soleList = listRepository.save(TodoList(name = "Sole"))
        listMembershipRepository.save(ListMembership(listId = soleList.id, userId = user.id, role = ListRole.OWNER))

        mockMvc.delete("/api/users/me") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isNoContent() }
        }

        assertFalse(userRepository.existsById(user.id))
        assertFalse(listRepository.existsById(soleList.id))
    }

    @Test
    fun `DELETE me - leaves shared list intact`() {
        val user = createUser()
        val otherOwner = createUser()

        val sharedList = listRepository.save(TodoList(name = "Shared"))
        listMembershipRepository.save(ListMembership(listId = sharedList.id, userId = user.id, role = ListRole.OWNER))
        listMembershipRepository.save(ListMembership(listId = sharedList.id, userId = otherOwner.id, role = ListRole.OWNER))

        mockMvc.delete("/api/users/me") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isNoContent() }
        }

        assertFalse(userRepository.existsById(user.id))
        assertTrue(listRepository.existsById(sharedList.id))
    }

    @Test
    fun `DELETE me - promotes editor to owner when user is sole owner with other members`() {
        val user = createUser()
        val editor = createUser()

        val list = listRepository.save(TodoList(name = "With Editor"))
        listMembershipRepository.save(ListMembership(listId = list.id, userId = user.id, role = ListRole.OWNER))
        listMembershipRepository.save(ListMembership(listId = list.id, userId = editor.id, role = ListRole.EDITOR))

        mockMvc.delete("/api/users/me") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isNoContent() }
        }

        assertFalse(userRepository.existsById(user.id))
        assertTrue(listRepository.existsById(list.id))
        val promoted = listMembershipRepository.findByListIdAndUserId(list.id, editor.id)
        assertNotNull(promoted)
        assert(promoted.role == ListRole.OWNER)
    }

    @Test
    fun `GET me deletion-preview - sole-owner with editors goes to listsToLeave not listsToDelete`() {
        val user = createUser()
        val editor = createUser()

        val list = listRepository.save(TodoList(name = "Has Editor"))
        listMembershipRepository.save(ListMembership(listId = list.id, userId = user.id, role = ListRole.OWNER))
        listMembershipRepository.save(ListMembership(listId = list.id, userId = editor.id, role = ListRole.EDITOR))

        mockMvc.get("/api/users/me/deletion-preview") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isOk() }
            jsonPath("$.listsToDelete") { isEmpty() }
            jsonPath("$.listsToLeave[0].name") { value("Has Editor") }
        }
    }

    // ─── Regression: SESSION_EXPIRED on POST /passkeys without prior register-options ──

    @Test
    fun `POST me passkeys returns 400 SESSION_EXPIRED when no register-options was called`() {
        val user = createUser()
        // Dummy attestation credential body — deserialization proceeds but load() returns null
        // because no register-options was called for this user beforehand.
        val body = """
            {
              "credential": {
                "id": "AAAA",
                "rawId": "AAAA",
                "type": "public-key",
                "response": {
                  "clientDataJSON": "AAAA",
                  "attestationObject": "AAAA",
                  "transports": []
                }
              },
              "label": null
            }
        """.trimIndent()

        mockMvc.post("/api/users/me/passkeys") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = body
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("SESSION_EXPIRED") }
        }
    }

    // ─── Regression: viewer-fallback promotion on DELETE /api/users/me ───────

    @Test
    fun `DELETE me - promotes viewer to owner when no editor exists`() {
        val user = createUser()
        val viewer = createUser()

        val list = listRepository.save(TodoList(name = "With Viewer"))
        listMembershipRepository.save(ListMembership(listId = list.id, userId = user.id, role = ListRole.OWNER))
        listMembershipRepository.save(ListMembership(listId = list.id, userId = viewer.id, role = ListRole.VIEWER))

        mockMvc.delete("/api/users/me") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isNoContent() }
        }

        assertFalse(userRepository.existsById(user.id))
        assertTrue(listRepository.existsById(list.id))
        val promoted = listMembershipRepository.findByListIdAndUserId(list.id, viewer.id)
        assertNotNull(promoted)
        assert(promoted.role == ListRole.OWNER)
    }

    @Test
    fun `GET me deletion-preview - sole-owner with only viewer goes to listsToLeave`() {
        val user = createUser()
        val viewer = createUser()

        val list = listRepository.save(TodoList(name = "Has Viewer"))
        listMembershipRepository.save(ListMembership(listId = list.id, userId = user.id, role = ListRole.OWNER))
        listMembershipRepository.save(ListMembership(listId = list.id, userId = viewer.id, role = ListRole.VIEWER))

        mockMvc.get("/api/users/me/deletion-preview") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isOk() }
            jsonPath("$.listsToDelete") { isEmpty() }
            jsonPath("$.listsToLeave[0].name") { value("Has Viewer") }
        }
    }
}
