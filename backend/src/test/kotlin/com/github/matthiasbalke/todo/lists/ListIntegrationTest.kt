package com.github.matthiasbalke.todo.lists

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
import org.springframework.test.web.servlet.put
import java.util.UUID
import kotlin.test.assertNotNull
import kotlin.test.assertNull

@AutoConfigureMockMvc
class ListIntegrationTest : AbstractIntegrationTest() {

    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var listRepository: ListRepository
    @Autowired private lateinit var listMembershipRepository: ListMembershipRepository
    @Autowired private lateinit var jwtTokenService: JwtTokenService

    private fun createUser(email: String = "user-${UUID.randomUUID()}@example.com"): User =
        userRepository.save(User(email = email, displayName = "Test User"))

    private fun tokenFor(user: User): String = jwtTokenService.generateAccessToken(user)

    private fun bearerHeader(user: User) = "Bearer ${tokenFor(user)}"

    // ─── POST /api/lists ──────────────────────────────────────────────────────

    @Test
    fun `POST lists - creator becomes OWNER and list appears in GET lists`() {
        val user = createUser()

        val result = mockMvc.post("/api/lists") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Groceries","emoji":"🛒"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.id") { exists() }
            jsonPath("$.name") { value("Groceries") }
            jsonPath("$.emoji") { value("🛒") }
        }.andReturn()

        val listId = com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(result.response.contentAsString)["id"].asText()

        // Verify membership
        val membership = listMembershipRepository.findByListIdAndUserId(UUID.fromString(listId), user.id)
        assertNotNull(membership)
        assert(membership.role == ListRole.OWNER)

        // Verify list appears in GET /api/lists
        mockMvc.get("/api/lists") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isOk() }
            jsonPath("$[?(@.id == '$listId')]") { exists() }
        }
    }

    // ─── GET /api/lists ───────────────────────────────────────────────────────

    @Test
    fun `GET lists - returns only lists the caller is member of`() {
        val alice = createUser()
        val bob = createUser()

        // Alice creates a list
        mockMvc.post("/api/lists") {
            header("Authorization", bearerHeader(alice))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Alice's List"}"""
        }.andExpect { status { isCreated() } }

        // Bob creates a list
        mockMvc.post("/api/lists") {
            header("Authorization", bearerHeader(bob))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Bob's List"}"""
        }.andExpect { status { isCreated() } }

        // Alice sees only her list
        val aliceLists = mockMvc.get("/api/lists") {
            header("Authorization", bearerHeader(alice))
        }.andExpect {
            status { isOk() }
        }.andReturn().response.contentAsString

        assert(aliceLists.contains("Alice's List"))
        assert(!aliceLists.contains("Bob's List"))
    }

    // ─── GET /api/lists/{id} ──────────────────────────────────────────────────

    @Test
    fun `GET lists - id - returns 403 for non-member`() {
        val owner = createUser()
        val stranger = createUser()

        val listId = createListAsUser(owner, "Owner's List")

        mockMvc.get("/api/lists/$listId") {
            header("Authorization", bearerHeader(stranger))
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── PUT /api/lists/{id} ──────────────────────────────────────────────────

    @Test
    fun `PUT lists - id - succeeds for OWNER`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "Original")

        mockMvc.put("/api/lists/$listId") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Updated"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.name") { value("Updated") }
        }
    }

    @Test
    fun `PUT lists - id - returns 403 for EDITOR`() {
        val owner = createUser()
        val editor = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, editor.email, "EDITOR")

        mockMvc.put("/api/lists/$listId") {
            header("Authorization", bearerHeader(editor))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Updated by Editor"}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `PUT lists - id - returns 403 for VIEWER`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, viewer.email, "VIEWER")

        mockMvc.put("/api/lists/$listId") {
            header("Authorization", bearerHeader(viewer))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Updated by Viewer"}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── DELETE /api/lists/{id} ───────────────────────────────────────────────

    @Test
    fun `DELETE lists - id - succeeds for OWNER`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "To Delete")

        mockMvc.delete("/api/lists/$listId") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isNoContent() }
        }

        assert(!listRepository.existsById(listId))
    }

    @Test
    fun `DELETE lists - id - returns 403 for EDITOR`() {
        val owner = createUser()
        val editor = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, editor.email, "EDITOR")

        mockMvc.delete("/api/lists/$listId") {
            header("Authorization", bearerHeader(editor))
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `DELETE lists - id - returns 403 for VIEWER`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, viewer.email, "VIEWER")

        mockMvc.delete("/api/lists/$listId") {
            header("Authorization", bearerHeader(viewer))
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `DELETE lists - id - cascades memberships`() {
        val owner = createUser()
        val member = createUser()
        val listId = createListAsUser(owner, "Cascade Test")
        addMemberToList(listId, owner, member.email, "VIEWER")

        mockMvc.delete("/api/lists/$listId") {
            header("Authorization", bearerHeader(owner))
        }.andExpect { status { isNoContent() } }

        assert(!listRepository.existsById(listId))
        assertNull(listMembershipRepository.findByListIdAndUserId(listId, owner.id))
        assertNull(listMembershipRepository.findByListIdAndUserId(listId, member.id))
    }

    // ─── POST /api/lists/{id}/members ─────────────────────────────────────────

    @Test
    fun `POST members - unknown email returns 404`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "My List")

        mockMvc.post("/api/lists/$listId/members") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"nonexistent@example.com","role":"VIEWER"}"""
        }.andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `POST members - already-member email returns 409`() {
        val owner = createUser()
        val member = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, member.email, "VIEWER")

        mockMvc.post("/api/lists/$listId/members") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"${member.email}","role":"EDITOR"}"""
        }.andExpect {
            status { isEqualTo(409) }
        }
    }

    @Test
    fun `POST members - non-OWNER returns 403`() {
        val owner = createUser()
        val editor = createUser()
        val target = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, editor.email, "EDITOR")

        mockMvc.post("/api/lists/$listId/members") {
            header("Authorization", bearerHeader(editor))
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"${target.email}","role":"VIEWER"}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── PUT /api/lists/{id}/members/{uid} ────────────────────────────────────

    @Test
    fun `PUT members - OWNER cannot demote self when sole OWNER`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "My List")

        mockMvc.put("/api/lists/$listId/members/${owner.id}") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"role":"VIEWER"}"""
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `PUT members - non-OWNER returns 403`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, viewer.email, "VIEWER")

        mockMvc.put("/api/lists/$listId/members/${viewer.id}") {
            header("Authorization", bearerHeader(viewer))
            contentType = MediaType.APPLICATION_JSON
            content = """{"role":"EDITOR"}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── DELETE /api/lists/{id}/members/{uid} ─────────────────────────────────

    @Test
    fun `DELETE members - OWNER cannot remove self when sole OWNER`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "My List")

        mockMvc.delete("/api/lists/$listId/members/${owner.id}") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `DELETE members - non-OWNER returns 403`() {
        val owner = createUser()
        val editor = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, editor.email, "EDITOR")

        mockMvc.delete("/api/lists/$listId/members/${editor.id}") {
            header("Authorization", bearerHeader(editor))
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private fun createListAsUser(user: User, name: String): UUID {
        val result = mockMvc.post("/api/lists") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"$name"}"""
        }.andExpect { status { isCreated() } }.andReturn()

        val idStr = com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(result.response.contentAsString)["id"].asText()
        return UUID.fromString(idStr)
    }

    private fun addMemberToList(listId: UUID, owner: User, email: String, role: String) {
        mockMvc.post("/api/lists/$listId/members") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","role":"$role"}"""
        }.andExpect { status { isCreated() } }
    }
}
