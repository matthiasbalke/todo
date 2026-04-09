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
import org.springframework.test.web.servlet.put
import java.util.UUID
import kotlin.test.assertFalse
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
        }
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
        val user1 = createUser()
        val user2 = createUser()
        mockMvc.put("/api/users/me") {
            header("Authorization", bearerHeader(user2))
            contentType = MediaType.APPLICATION_JSON
            content = """{"displayName":"${user2.displayName}","email":"${user1.email}"}"""
        }.andExpect {
            status { isEqualTo(409) }
            jsonPath("$.code") { value("EMAIL_IN_USE") }
        }
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
}
