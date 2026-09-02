package com.github.matthiasbalke.todo.lists

import tools.jackson.databind.ObjectMapper
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

@AutoConfigureMockMvc
class CategoryIntegrationTest : AbstractIntegrationTest() {

    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var jwtTokenService: JwtTokenService

    private val mapper = ObjectMapper()

    private fun createUser(): User =
        userRepository.save(User(email = "user-${UUID.randomUUID()}@example.com", displayName = "Test User"))

    private fun bearerHeader(user: User) = "Bearer ${jwtTokenService.generateAccessToken(user)}"

    private fun createListAsUser(user: User, name: String): UUID {
        val result = mockMvc.post("/api/lists") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"$name"}"""
        }.andExpect { status { isCreated() } }.andReturn()
        return UUID.fromString(mapper.readTree(result.response.contentAsString)["id"].asText())
    }

    private fun addMemberToList(listId: UUID, owner: User, email: String, role: String) {
        mockMvc.post("/api/lists/$listId/members") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","role":"$role"}"""
        }.andExpect { status { isCreated() } }
    }

    private fun createCategoryInList(listId: UUID, user: User, name: String, sortOrder: Int = 0): UUID {
        val result = mockMvc.post("/api/lists/$listId/categories") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"$name","sortOrder":$sortOrder}"""
        }.andExpect { status { isCreated() } }.andReturn()
        return UUID.fromString(mapper.readTree(result.response.contentAsString)["id"].asText())
    }

    // ─── GET /api/lists/{id}/categories ──────────────────────────────────────

    @Test
    fun `GET categories - returns categories ordered by sortOrder`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "My List")
        createCategoryInList(listId, owner, "B", sortOrder = 2)
        createCategoryInList(listId, owner, "A", sortOrder = 1)

        mockMvc.get("/api/lists/$listId/categories") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].name") { value("A") }
            jsonPath("$[1].name") { value("B") }
        }
    }

    @Test
    fun `GET categories - returns 403 for non-member`() {
        val owner = createUser()
        val stranger = createUser()
        val listId = createListAsUser(owner, "My List")

        mockMvc.get("/api/lists/$listId/categories") {
            header("Authorization", bearerHeader(stranger))
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── POST /api/lists/{id}/categories ─────────────────────────────────────

    @Test
    fun `POST categories - creates category with name and color`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "My List")

        mockMvc.post("/api/lists/$listId/categories") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Produce","color":"#4ade80","sortOrder":1}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.id") { exists() }
            jsonPath("$.name") { value("Produce") }
            jsonPath("$.color") { value("#4ade80") }
            jsonPath("$.sortOrder") { value(1) }
            jsonPath("$.listId") { value(listId.toString()) }
        }
    }

    @Test
    fun `POST categories - returns 403 for VIEWER`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, viewer.email, "VIEWER")

        mockMvc.post("/api/lists/$listId/categories") {
            header("Authorization", bearerHeader(viewer))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Produce","sortOrder":1}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `POST categories - succeeds for EDITOR`() {
        val owner = createUser()
        val editor = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, editor.email, "EDITOR")

        mockMvc.post("/api/lists/$listId/categories") {
            header("Authorization", bearerHeader(editor))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Dairy","sortOrder":1}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.name") { value("Dairy") }
        }
    }

    // ─── PUT /api/lists/{id}/categories/{cid} ────────────────────────────────

    @Test
    fun `PUT categories - updates name, color and sortOrder`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "My List")
        val catId = createCategoryInList(listId, owner, "Old Name", sortOrder = 1)

        mockMvc.put("/api/lists/$listId/categories/$catId") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"New Name","color":"#f87171","sortOrder":2}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.name") { value("New Name") }
            jsonPath("$.color") { value("#f87171") }
            jsonPath("$.sortOrder") { value(2) }
        }
    }

    @Test
    fun `PUT categories - returns 403 for VIEWER`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, viewer.email, "VIEWER")
        val catId = createCategoryInList(listId, owner, "Cat", sortOrder = 1)

        mockMvc.put("/api/lists/$listId/categories/$catId") {
            header("Authorization", bearerHeader(viewer))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Updated","sortOrder":1}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `PUT categories - returns 404 for category belonging to a different list`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "List A")
        val otherListId = createListAsUser(owner, "List B")
        val catId = createCategoryInList(otherListId, owner, "Cat", sortOrder = 1)

        mockMvc.put("/api/lists/$listId/categories/$catId") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Updated","sortOrder":1}"""
        }.andExpect {
            status { isNotFound() }
        }
    }

    // ─── POST /api/lists/{id}/categories/reorder ────────────────────────────

    @Test
    fun `POST categories reorder - reorders and normalizes category sortOrder values`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "My List")
        val produce = createCategoryInList(listId, owner, "Produce", sortOrder = 10)
        val dairy = createCategoryInList(listId, owner, "Dairy", sortOrder = 20)
        val bakery = createCategoryInList(listId, owner, "Bakery", sortOrder = 30)

        mockMvc.post("/api/lists/$listId/categories/reorder") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"categoryIds":["$bakery","$produce","$dairy"]}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(bakery.toString()) }
            jsonPath("$[0].sortOrder") { value(0) }
            jsonPath("$[1].id") { value(produce.toString()) }
            jsonPath("$[1].sortOrder") { value(1) }
            jsonPath("$[2].id") { value(dairy.toString()) }
            jsonPath("$[2].sortOrder") { value(2) }
        }

        mockMvc.get("/api/lists/$listId/categories") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(bakery.toString()) }
            jsonPath("$[1].id") { value(produce.toString()) }
            jsonPath("$[2].id") { value(dairy.toString()) }
        }
    }

    @Test
    fun `POST categories reorder - returns 400 for foreign category IDs`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "List A")
        val otherListId = createListAsUser(owner, "List B")
        val category = createCategoryInList(listId, owner, "Produce", sortOrder = 1)
        val foreignCategory = createCategoryInList(otherListId, owner, "Dairy", sortOrder = 1)

        mockMvc.post("/api/lists/$listId/categories/reorder") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"categoryIds":["$category","$foreignCategory"]}"""
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `POST categories reorder - returns 400 for missing category IDs`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "My List")
        val category = createCategoryInList(listId, owner, "Produce", sortOrder = 1)
        createCategoryInList(listId, owner, "Dairy", sortOrder = 2)

        mockMvc.post("/api/lists/$listId/categories/reorder") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"categoryIds":["$category"]}"""
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `POST categories reorder - returns 403 for VIEWER`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, viewer.email, "VIEWER")
        val category = createCategoryInList(listId, owner, "Produce", sortOrder = 1)

        mockMvc.post("/api/lists/$listId/categories/reorder") {
            header("Authorization", bearerHeader(viewer))
            contentType = MediaType.APPLICATION_JSON
            content = """{"categoryIds":["$category"]}"""
        }.andExpect {
            status { isForbidden() }
        }
    }

    // ─── DELETE /api/lists/{id}/categories/{cid} ─────────────────────────────

    @Test
    fun `DELETE categories - removes category`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "My List")
        val catId = createCategoryInList(listId, owner, "ToDelete", sortOrder = 1)

        mockMvc.delete("/api/lists/$listId/categories/$catId") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isNoContent() }
        }

        mockMvc.get("/api/lists/$listId/categories") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isOk() }
            jsonPath("$") { isEmpty() }
        }
    }

    @Test
    fun `DELETE categories - returns 403 for VIEWER`() {
        val owner = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner, "My List")
        addMemberToList(listId, owner, viewer.email, "VIEWER")
        val catId = createCategoryInList(listId, owner, "Cat", sortOrder = 1)

        mockMvc.delete("/api/lists/$listId/categories/$catId") {
            header("Authorization", bearerHeader(viewer))
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `DELETE categories - returns 404 for category belonging to a different list`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "List A")
        val otherListId = createListAsUser(owner, "List B")
        val catId = createCategoryInList(otherListId, owner, "Cat", sortOrder = 1)

        mockMvc.delete("/api/lists/$listId/categories/$catId") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isNotFound() }
        }
    }
}
