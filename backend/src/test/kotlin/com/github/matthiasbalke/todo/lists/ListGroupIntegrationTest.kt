package com.github.matthiasbalke.todo.lists

import tools.jackson.databind.json.JsonMapper
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
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import java.util.UUID

@AutoConfigureMockMvc
class ListGroupIntegrationTest : AbstractIntegrationTest() {

    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var jwtTokenService: JwtTokenService

    private fun createUser(email: String = "user-${UUID.randomUUID()}@example.com"): User =
        userRepository.save(User(email = email, displayName = "Test User"))

    private fun bearerHeader(user: User) = "Bearer ${jwtTokenService.generateAccessToken(user)}"

    private val mapper = JsonMapper()

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private fun createGroupAsUser(user: User, name: String): UUID {
        val result = mockMvc.post("/api/list-groups") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"$name"}"""
        }.andExpect { status { isCreated() } }.andReturn()
        return UUID.fromString(mapper.readTree(result.response.contentAsString)["id"].asString())
    }

    private fun createListAsUser(user: User, name: String): UUID {
        val result = mockMvc.post("/api/lists") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"$name"}"""
        }.andExpect { status { isCreated() } }.andReturn()
        return UUID.fromString(mapper.readTree(result.response.contentAsString)["id"].asString())
    }

    // ─── POST /api/list-groups ────────────────────────────────────────────────

    @Test
    fun `POST list-groups - creates group and appears in GET`() {
        val user = createUser()

        mockMvc.post("/api/list-groups") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Home"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.id") { exists() }
            jsonPath("$.name") { value("Home") }
            jsonPath("$.sortOrder") { exists() }
        }

        mockMvc.get("/api/list-groups") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isOk() }
            jsonPath("$[?(@.name == 'Home')]") { exists() }
        }
    }

    @Test
    fun `POST list-groups - creating a second group succeeds and gets incremented sortOrder`() {
        val user = createUser()
        createGroupAsUser(user, "Group A")   // sortOrder 0
        mockMvc.post("/api/list-groups") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Group B"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.sortOrder") { value(1) }
        }
    }

    // ─── PUT /api/list-groups/{gid} ───────────────────────────────────────────

    @Test
    fun `PUT list-groups - gid - renames group`() {
        val user = createUser()
        val gid = createGroupAsUser(user, "Old Name")

        mockMvc.put("/api/list-groups/$gid") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"New Name"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.name") { value("New Name") }
        }
    }

    @Test
    fun `PUT list-groups - gid - non-owner gets 403`() {
        val owner = createUser()
        val other = createUser()
        val gid = createGroupAsUser(owner, "Private Group")

        mockMvc.put("/api/list-groups/$gid") {
            header("Authorization", bearerHeader(other))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Hijacked"}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── DELETE /api/list-groups/{gid} ────────────────────────────────────────

    @Test
    fun `DELETE list-groups - gid - deletes group and lists become ungrouped`() {
        val user = createUser()
        val gid = createGroupAsUser(user, "To Delete")
        val listId = createListAsUser(user, "My List")

        // Assign list to group
        mockMvc.patch("/api/lists/$listId/group") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupId":"$gid"}"""
        }.andExpect { status { isOk() } }

        // Delete group
        mockMvc.delete("/api/list-groups/$gid") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isNoContent() }
        }

        // List should now be ungrouped
        mockMvc.get("/api/lists") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isOk() }
            jsonPath("$[?(@.id == '$listId')].groupId") { value(null) }
        }
    }

    @Test
    fun `DELETE list-groups - gid - non-owner gets 403`() {
        val owner = createUser()
        val other = createUser()
        val gid = createGroupAsUser(owner, "Private Group")

        mockMvc.delete("/api/list-groups/$gid") {
            header("Authorization", bearerHeader(other))
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── PATCH /api/list-groups/{gid}/order ───────────────────────────────────

    @Test
    fun `PATCH list-groups - gid - order - updates sortOrder`() {
        val user = createUser()
        val gid = createGroupAsUser(user, "Reorder Me")

        mockMvc.patch("/api/list-groups/$gid/order") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"sortOrder":42}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.sortOrder") { value(42) }
        }
    }

    @Test
    fun `PATCH list-groups - gid - order - non-owner gets 403`() {
        val owner = createUser()
        val other = createUser()
        val gid = createGroupAsUser(owner, "Private Group")

        mockMvc.patch("/api/list-groups/$gid/order") {
            header("Authorization", bearerHeader(other))
            contentType = MediaType.APPLICATION_JSON
            content = """{"sortOrder":0}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── POST /api/list-groups/reorder ───────────────────────────────────────

    @Test
    fun `POST list-groups reorder - reorders and normalizes sortOrder values`() {
        val user = createUser()
        val home = createGroupAsUser(user, "Home")
        val work = createGroupAsUser(user, "Work")
        val errands = createGroupAsUser(user, "Errands")

        mockMvc.patch("/api/list-groups/$home/order") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"sortOrder":10}"""
        }.andExpect { status { isOk() } }
        mockMvc.patch("/api/list-groups/$work/order") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"sortOrder":20}"""
        }.andExpect { status { isOk() } }
        mockMvc.patch("/api/list-groups/$errands/order") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"sortOrder":30}"""
        }.andExpect { status { isOk() } }

        mockMvc.post("/api/list-groups/reorder") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupIds":["$errands","$home","$work"]}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(errands.toString()) }
            jsonPath("$[0].sortOrder") { value(0) }
            jsonPath("$[1].id") { value(home.toString()) }
            jsonPath("$[1].sortOrder") { value(1) }
            jsonPath("$[2].id") { value(work.toString()) }
            jsonPath("$[2].sortOrder") { value(2) }
        }

        mockMvc.get("/api/list-groups") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(errands.toString()) }
            jsonPath("$[1].id") { value(home.toString()) }
            jsonPath("$[2].id") { value(work.toString()) }
        }
    }

    @Test
    fun `POST list-groups reorder - returns 400 for duplicate group IDs`() {
        val user = createUser()
        val home = createGroupAsUser(user, "Home")
        createGroupAsUser(user, "Work")

        mockMvc.post("/api/list-groups/reorder") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupIds":["$home","$home"]}"""
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `POST list-groups reorder - returns 400 for missing group IDs`() {
        val user = createUser()
        val home = createGroupAsUser(user, "Home")
        createGroupAsUser(user, "Work")

        mockMvc.post("/api/list-groups/reorder") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupIds":["$home"]}"""
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `POST list-groups reorder - returns 400 for unknown group IDs`() {
        val user = createUser()
        val home = createGroupAsUser(user, "Home")
        val unknown = UUID.randomUUID()

        mockMvc.post("/api/list-groups/reorder") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupIds":["$home","$unknown"]}"""
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `POST list-groups reorder - returns 403 for foreign group IDs`() {
        val owner = createUser()
        val other = createUser()
        val ownerGroup = createGroupAsUser(owner, "Home")
        val foreignGroup = createGroupAsUser(other, "Other")

        mockMvc.post("/api/list-groups/reorder") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupIds":["$ownerGroup","$foreignGroup"]}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── PATCH /api/lists/{id}/group ──────────────────────────────────────────

    @Test
    fun `PATCH lists - id - group - assigns list to group and visible in GET lists`() {
        val user = createUser()
        val gid = createGroupAsUser(user, "Home")
        val listId = createListAsUser(user, "Groceries")

        mockMvc.patch("/api/lists/$listId/group") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupId":"$gid"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.groupId") { value(gid.toString()) }
        }

        mockMvc.get("/api/lists") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isOk() }
            jsonPath("$[?(@.id == '$listId')].groupId") { value(gid.toString()) }
        }
    }

    @Test
    fun `PATCH lists - id - group - unassigns list when groupId is null`() {
        val user = createUser()
        val gid = createGroupAsUser(user, "Home")
        val listId = createListAsUser(user, "Groceries")

        mockMvc.patch("/api/lists/$listId/group") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupId":"$gid"}"""
        }.andExpect { status { isOk() } }

        mockMvc.patch("/api/lists/$listId/group") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupId":null}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.groupId") { value(null) }
        }
    }

    @Test
    fun `PATCH lists - id - group - non-member gets 403`() {
        val owner = createUser()
        val stranger = createUser()
        val gid = createGroupAsUser(stranger, "Stranger Group")
        val listId = createListAsUser(owner, "Owner List")

        mockMvc.patch("/api/lists/$listId/group") {
            header("Authorization", bearerHeader(stranger))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupId":"$gid"}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── PATCH /api/lists/{id}/group-order ────────────────────────────────────

    @Test
    fun `PATCH lists - id - group-order - updates sortOrderInGroup`() {
        val user = createUser()
        val listId = createListAsUser(user, "My List")

        mockMvc.patch("/api/lists/$listId/group-order") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"sortOrder":5}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.sortOrderInGroup") { value(5) }
        }
    }

    @Test
    fun `PATCH lists - id - group-order - non-member gets 403`() {
        val owner = createUser()
        val stranger = createUser()
        val listId = createListAsUser(owner, "Owner List")

        mockMvc.patch("/api/lists/$listId/group-order") {
            header("Authorization", bearerHeader(stranger))
            contentType = MediaType.APPLICATION_JSON
            content = """{"sortOrder":0}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── Shared lists with per-user group assignments ─────────────────────────

    @Test
    fun `shared list - each user should be able to assign it to different groups`() {
        // Setup: Two users, a shared list
        val userA = createUser()
        val userB = createUser()
        val listId = createListAsUser(userA, "Shared List")

        // User A adds User B as an editor
        mockMvc.post("/api/lists/$listId/members") {
            header("Authorization", bearerHeader(userA))
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"${userB.email}","role":"EDITOR"}"""
        }.andExpect { status { isCreated() } }

        // User A creates group A1 and assigns the list to it
        val groupA1 = createGroupAsUser(userA, "Group A1")
        mockMvc.patch("/api/lists/$listId/group") {
            header("Authorization", bearerHeader(userA))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupId":"$groupA1"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.groupId") { value(groupA1.toString()) }
        }

        // User B creates group B1 and assigns the same list to it
        val groupB1 = createGroupAsUser(userB, "Group B1")
        mockMvc.patch("/api/lists/$listId/group") {
            header("Authorization", bearerHeader(userB))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupId":"$groupB1"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.groupId") { value(groupB1.toString()) }
        }

        // Verify User A sees the list in group A1
        mockMvc.get("/api/lists") {
            header("Authorization", bearerHeader(userA))
        }.andExpect {
            status { isOk() }
            jsonPath("$[?(@.id == '$listId')].groupId") { value(groupA1.toString()) }
        }

        // Verify User B sees the list in group B1
        mockMvc.get("/api/lists") {
            header("Authorization", bearerHeader(userB))
        }.andExpect {
            status { isOk() }
            jsonPath("$[?(@.id == '$listId')].groupId") { value(groupB1.toString()) }
        }
    }
}
