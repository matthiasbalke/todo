package com.github.matthiasbalke.todo.items

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
import java.time.LocalDate
import java.util.UUID

@AutoConfigureMockMvc
class ItemIntegrationTest : AbstractIntegrationTest() {

    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var jwtTokenService: JwtTokenService

    private val mapper = JsonMapper()

    private fun createUser(): User =
        userRepository.save(User(email = "user-${UUID.randomUUID()}@example.com", displayName = "Test User"))

    private fun bearerHeader(user: User) = "Bearer ${jwtTokenService.generateAccessToken(user)}"

    private fun createListAsUser(user: User, name: String = "My List"): UUID {
        val result = mockMvc.post("/api/lists") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"$name"}"""
        }.andExpect { status { isCreated() } }.andReturn()
        return UUID.fromString(mapper.readTree(result.response.contentAsString)["id"].asString())
    }

    private fun addMemberToList(listId: UUID, owner: User, email: String, role: String) {
        mockMvc.post("/api/lists/$listId/members") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","role":"$role"}"""
        }.andExpect { status { isCreated() } }
    }

    private fun createItemInList(listId: UUID, user: User, title: String = "Test Item"): UUID {
        val result = mockMvc.post("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"title":"$title"}"""
        }.andExpect { status { isCreated() } }.andReturn()
        return UUID.fromString(mapper.readTree(result.response.contentAsString)["id"].asString())
    }

    // ─── GET /api/lists/{id}/items ────────────────────────────────────────────

    @Test
    fun `GET items - returns all items for list`() {
        val owner = createUser()
        val listId = createListAsUser(owner)
        createItemInList(listId, owner, "First")
        createItemInList(listId, owner, "Second")

        mockMvc.get("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isOk() }
            jsonPath("$.length()") { value(2) }
        }
    }

    @Test
    fun `GET items - returns 403 for non-member`() {
        val owner = createUser()
        val stranger = createUser()
        val listId = createListAsUser(owner)

        mockMvc.get("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(stranger))
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `GET items - VIEWER can read items`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner)
        addMemberToList(listId, owner, viewer.email, "VIEWER")
        createItemInList(listId, owner, "Task")

        mockMvc.get("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(viewer))
        }.andExpect {
            status { isOk() }
            jsonPath("$.length()") { value(1) }
        }
    }

    // ─── POST /api/lists/{id}/items ───────────────────────────────────────────

    @Test
    fun `POST items - creates item with all fields`() {
        val owner = createUser()
        val listId = createListAsUser(owner)

        mockMvc.post("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{
                "title": "Buy milk",
                "notes": "Full fat",
                "dueDate": "2025-12-01",
                "starred": true,
                "recurrenceRule": {"intervalUnit": "WEEKS", "intervalValue": 1},
                "sortOrder": 5
            }"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.id") { exists() }
            jsonPath("$.title") { value("Buy milk") }
            jsonPath("$.notes") { value("Full fat") }
            jsonPath("$.dueDate") { value("2025-12-01") }
            jsonPath("$.starred") { value(true) }
            jsonPath("$.done") { value(false) }
            jsonPath("$.recurrenceRule.intervalUnit") { value("WEEKS") }
            jsonPath("$.recurrenceRule.intervalValue") { value(1) }
            jsonPath("$.sortOrder") { value(5) }
            jsonPath("$.assignedUserIds") { isArray() }
            jsonPath("$.createdByUserId") { value(owner.id.toString()) }
        }
    }

    @Test
    fun `POST items - returns 403 for VIEWER`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner)
        addMemberToList(listId, owner, viewer.email, "VIEWER")

        mockMvc.post("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(viewer))
            contentType = MediaType.APPLICATION_JSON
            content = """{"title":"Blocked"}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `POST items - EDITOR can create items`() {
        val owner = createUser()
        val editor = createUser()
        val listId = createListAsUser(owner)
        addMemberToList(listId, owner, editor.email, "EDITOR")

        mockMvc.post("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(editor))
            contentType = MediaType.APPLICATION_JSON
            content = """{"title":"Editor task"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.title") { value("Editor task") }
        }
    }

    // ─── PUT /api/lists/{id}/items/{iid} ─────────────────────────────────────

    @Test
    fun `PUT items - updates all fields`() {
        val owner = createUser()
        val listId = createListAsUser(owner)
        val itemId = createItemInList(listId, owner, "Original")

        mockMvc.put("/api/lists/$listId/items/$itemId") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"title":"Updated","notes":"New note","sortOrder":10}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.title") { value("Updated") }
            jsonPath("$.notes") { value("New note") }
            jsonPath("$.sortOrder") { value(10) }
        }
    }

    @Test
    fun `PUT items - returns 403 for VIEWER`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner)
        addMemberToList(listId, owner, viewer.email, "VIEWER")
        val itemId = createItemInList(listId, owner)

        mockMvc.put("/api/lists/$listId/items/$itemId") {
            header("Authorization", bearerHeader(viewer))
            contentType = MediaType.APPLICATION_JSON
            content = """{"title":"Blocked"}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `PUT items - returns 404 for item belonging to a different list`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "List A")
        val otherListId = createListAsUser(owner, "List B")
        val itemId = createItemInList(otherListId, owner)

        mockMvc.put("/api/lists/$listId/items/$itemId") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"title":"Mismatch"}"""
        }.andExpect {
            status { isNotFound() }
        }
    }

    // ─── DELETE /api/lists/{id}/items/{iid} ───────────────────────────────────

    @Test
    fun `DELETE items - removes item`() {
        val owner = createUser()
        val listId = createListAsUser(owner)
        val itemId = createItemInList(listId, owner)

        mockMvc.delete("/api/lists/$listId/items/$itemId") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isNoContent() }
        }

        mockMvc.get("/api/lists/$listId/items/$itemId") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `DELETE items - returns 403 for VIEWER`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner)
        addMemberToList(listId, owner, viewer.email, "VIEWER")
        val itemId = createItemInList(listId, owner)

        mockMvc.delete("/api/lists/$listId/items/$itemId") {
            header("Authorization", bearerHeader(viewer))
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── PATCH /done ──────────────────────────────────────────────────────────

    @Test
    fun `PATCH done - toggles done flag`() {
        val owner = createUser()
        val listId = createListAsUser(owner)
        val itemId = createItemInList(listId, owner)

        mockMvc.patch("/api/lists/$listId/items/$itemId/done") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isOk() }
            jsonPath("$.done") { value(true) }
        }

        mockMvc.patch("/api/lists/$listId/items/$itemId/done") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isOk() }
            jsonPath("$.done") { value(false) }
        }
    }

    @Test
    fun `PATCH done - creates next recurring instance with due date`() {
        val owner = createUser()
        val listId = createListAsUser(owner)

        val result = mockMvc.post("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{
                "title": "Weekly task",
                "dueDate": "2025-06-01",
                "recurrenceRule": {"intervalUnit": "WEEKS", "intervalValue": 2}
            }"""
        }.andExpect { status { isCreated() } }.andReturn()
        val itemId = UUID.fromString(mapper.readTree(result.response.contentAsString)["id"].asString())

        mockMvc.patch("/api/lists/$listId/items/$itemId/done") {
            header("Authorization", bearerHeader(owner))
        }.andExpect { status { isOk() } }

        // The list should now contain 2 items: the done original + the new instance
        mockMvc.get("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isOk() }
            jsonPath("$.length()") { value(2) }
        }

        // Check the new item has the correct next due date (2025-06-01 + 2 weeks = 2025-06-15)
        val items = mapper.readTree(mockMvc.get("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(owner))
        }.andReturn().response.contentAsString)
        val newItem = items.first { !it["done"].asBoolean() }
        assert(newItem["dueDate"].asString() == "2025-06-15") {
            "Expected 2025-06-15 but got ${newItem["dueDate"].asString()}"
        }
        assert(newItem["parentItemId"].asString() == itemId.toString()) {
            "Expected parentItemId to be $itemId"
        }
    }

    @Test
    fun `PATCH done - creates next recurring instance without due date using today plus interval`() {
        val owner = createUser()
        val listId = createListAsUser(owner)

        val result = mockMvc.post("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{
                "title": "Daily task",
                "recurrenceRule": {"intervalUnit": "DAYS", "intervalValue": 1}
            }"""
        }.andExpect { status { isCreated() } }.andReturn()
        val itemId = UUID.fromString(mapper.readTree(result.response.contentAsString)["id"].asString())

        mockMvc.patch("/api/lists/$listId/items/$itemId/done") {
            header("Authorization", bearerHeader(owner))
        }.andExpect { status { isOk() } }

        val items = mapper.readTree(mockMvc.get("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(owner))
        }.andReturn().response.contentAsString)
        val newItem = items.first { !it["done"].asBoolean() }
        val expectedDueDate = LocalDate.now().plusDays(1).toString()
        assert(newItem["dueDate"].asString() == expectedDueDate) {
            "Expected $expectedDueDate but got ${newItem["dueDate"].asString()}"
        }
    }

    @Test
    fun `PATCH done - returns 403 for VIEWER`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner)
        addMemberToList(listId, owner, viewer.email, "VIEWER")
        val itemId = createItemInList(listId, owner)

        mockMvc.patch("/api/lists/$listId/items/$itemId/done") {
            header("Authorization", bearerHeader(viewer))
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── POST /reorder ────────────────────────────────────────────────────────

    @Test
    fun `POST reorder - EDITOR reorders items and sortOrder values persist`() {
        val owner = createUser()
        val listId = createListAsUser(owner)
        val item1 = createItemInList(listId, owner, "First")
        val item2 = createItemInList(listId, owner, "Second")
        val item3 = createItemInList(listId, owner, "Third")

        mockMvc.post("/api/lists/$listId/items/reorder") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"items":[{"id":"$item3","sortOrder":0},{"id":"$item1","sortOrder":1},{"id":"$item2","sortOrder":2}]}"""
        }.andExpect {
            status { isNoContent() }
        }

        val items = mapper.readTree(mockMvc.get("/api/lists/$listId/items") {
            header("Authorization", bearerHeader(owner))
        }.andReturn().response.contentAsString)

        val orderById = items.associate { it["id"].asString() to it["sortOrder"].asInt() }
        assert(orderById[item3.toString()] == 0) { "item3 should have sortOrder 0" }
        assert(orderById[item1.toString()] == 1) { "item1 should have sortOrder 1" }
        assert(orderById[item2.toString()] == 2) { "item2 should have sortOrder 2" }
    }

    @Test
    fun `POST reorder - VIEWER gets 403`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner)
        addMemberToList(listId, owner, viewer.email, "VIEWER")
        val item1 = createItemInList(listId, owner)

        mockMvc.post("/api/lists/$listId/items/reorder") {
            header("Authorization", bearerHeader(viewer))
            contentType = MediaType.APPLICATION_JSON
            content = """{"items":[{"id":"$item1","sortOrder":0}]}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `POST reorder - item IDs from another list are silently skipped`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "List A")
        val otherListId = createListAsUser(owner, "List B")
        val item1 = createItemInList(listId, owner, "Own item")
        val foreignItem = createItemInList(otherListId, owner, "Foreign item")

        mockMvc.post("/api/lists/$listId/items/reorder") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"items":[{"id":"$item1","sortOrder":0},{"id":"$foreignItem","sortOrder":1}]}"""
        }.andExpect {
            status { isNoContent() }
        }

        // Foreign item's sortOrder should be unchanged (still 0, the default)
        mockMvc.get("/api/lists/$otherListId/items/$foreignItem") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isOk() }
            jsonPath("$.sortOrder") { value(0) }
        }
    }

    // ─── PATCH /starred ───────────────────────────────────────────────────────

    @Test
    fun `PATCH starred - toggles starred flag`() {
        val owner = createUser()
        val listId = createListAsUser(owner)
        val itemId = createItemInList(listId, owner)

        mockMvc.patch("/api/lists/$listId/items/$itemId/starred") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isOk() }
            jsonPath("$.starred") { value(true) }
        }

        mockMvc.patch("/api/lists/$listId/items/$itemId/starred") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isOk() }
            jsonPath("$.starred") { value(false) }
        }
    }

    @Test
    fun `PATCH starred - returns 403 for VIEWER`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner)
        addMemberToList(listId, owner, viewer.email, "VIEWER")
        val itemId = createItemInList(listId, owner)

        mockMvc.patch("/api/lists/$listId/items/$itemId/starred") {
            header("Authorization", bearerHeader(viewer))
        }.andExpect {
            status { isForbidden() }
        }
    }
}
