package com.github.matthiasbalke.todo.lists

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.auth.JwtTokenService
import com.github.matthiasbalke.todo.auth.User
import com.github.matthiasbalke.todo.auth.UserRepository
import com.github.matthiasbalke.todo.items.IntervalUnit
import com.github.matthiasbalke.todo.items.ItemAssignment
import com.github.matthiasbalke.todo.items.ItemAssignmentId
import com.github.matthiasbalke.todo.items.ItemAssignmentRepository
import com.github.matthiasbalke.todo.items.ItemRepository
import com.github.matthiasbalke.todo.items.RecurrenceRule
import com.github.matthiasbalke.todo.items.TodoItem
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
import tools.jackson.databind.json.JsonMapper
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

@AutoConfigureMockMvc
class ListIntegrationTest : AbstractIntegrationTest() {

    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var listRepository: ListRepository
    @Autowired private lateinit var listMembershipRepository: ListMembershipRepository
    @Autowired private lateinit var listGroupAssignmentRepository: ListGroupAssignmentRepository
    @Autowired private lateinit var categoryRepository: CategoryRepository
    @Autowired private lateinit var itemRepository: ItemRepository
    @Autowired private lateinit var itemAssignmentRepository: ItemAssignmentRepository
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
            jsonPath("$.role") { value("OWNER") }
        }.andReturn()

        val listId = JsonMapper()
            .readTree(result.response.contentAsString)["id"].asString()

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

    @Test
    fun `GET lists - returns shared lists that appear in member's view`() {
        val owner = createUser()
        val sharedUser = createUser()

        // Owner creates a list
        val listId = createListAsUser(owner, "Shared List")

        // Owner shares list with sharedUser
        addMemberToList(listId, owner, sharedUser.email, "VIEWER")

        // sharedUser should see the shared list in their GET /api/lists
        val sharedUserLists = mockMvc.get("/api/lists") {
            header("Authorization", bearerHeader(sharedUser))
        }.andExpect {
            status { isOk() }
        }.andReturn().response.contentAsString

        assertTrue(sharedUserLists.contains("Shared List"), "Shared list should appear in shared user's GET /api/lists")
    }

    @Test
    fun `GET lists - includes the caller role for owner editor and viewer`() {
        val owner = createUser()
        val editor = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner, "Role List")
        addMemberToList(listId, owner, editor.email, "EDITOR")
        addMemberToList(listId, owner, viewer.email, "VIEWER")

        listOf(owner to "OWNER", editor to "EDITOR", viewer to "VIEWER").forEach { (user, role) ->
            mockMvc.get("/api/lists") {
                header("Authorization", bearerHeader(user))
            }.andExpect {
                status { isOk() }
                jsonPath("$[0].role") { value(role) }
            }
        }
    }

    @Test
    fun `GET lists - returns shared lists with groupId assigned`() {
        val owner = createUser()
        val sharedUser = createUser()

        // Owner creates a list group
        val groupId = createGroupAsUser(owner, "Shopping")

        // Owner creates a list
        val listId = createListAsUser(owner, "Groceries")

        // Owner assigns list to group
        mockMvc.patch("/api/lists/$listId/group") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"groupId":"$groupId"}"""
        }.andExpect { status { isOk() } }

        // Owner shares list with sharedUser
        addMemberToList(listId, owner, sharedUser.email, "VIEWER")

        // Verify owner sees the list with groupId
        val ownerLists = mockMvc.get("/api/lists") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isOk() }
        }.andReturn().response.contentAsString

        assertTrue(ownerLists.contains("Groceries"), "Owner should see their list with groupId")

        // sharedUser should see the shared list without groupId (since they don't own the group)
        val sharedUserLists = mockMvc.get("/api/lists") {
            header("Authorization", bearerHeader(sharedUser))
        }.andExpect {
            status { isOk() }
        }.andReturn().response.contentAsString

        assertTrue(sharedUserLists.contains("Groceries"), "Shared list with groupId should appear in shared user's GET /api/lists even if they don't own the group")
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

    @Test
    fun `GET lists - id - includes the caller role for owner editor and viewer`() {
        val owner = createUser()
        val editor = createUser()
        val viewer = createUser()
        val listId = createListAsUser(owner, "Role Detail")
        addMemberToList(listId, owner, editor.email, "EDITOR")
        addMemberToList(listId, owner, viewer.email, "VIEWER")

        listOf(owner to "OWNER", editor to "EDITOR", viewer to "VIEWER").forEach { (user, role) ->
            mockMvc.get("/api/lists/$listId") {
                header("Authorization", bearerHeader(user))
            }.andExpect {
                status { isOk() }
                jsonPath("$.role") { value(role) }
            }
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

    // ─── POST /api/lists/{id}/duplicate ──────────────────────────────────────

    @Test
    fun `POST lists - id - duplicate creates owner copy with next suffix`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "Groceries")

        val duplicateId = duplicateListAsUser(listId, owner)

        mockMvc.get("/api/lists/$duplicateId") {
            header("Authorization", bearerHeader(owner))
        }.andExpect {
            status { isOk() }
            jsonPath("$.name") { value("Groceries (1)") }
            jsonPath("$.role") { value("OWNER") }
        }

        val membership = listMembershipRepository.findByListIdAndUserId(duplicateId, owner.id)
        assertNotNull(membership)
        assertEquals(ListRole.OWNER, membership.role)
    }

    @Test
    fun `POST lists - id - duplicate rejects non owners and non members`() {
        val owner = createUser()
        val editor = createUser()
        val viewer = createUser()
        val stranger = createUser()
        val listId = createListAsUser(owner, "Private")
        addMemberToList(listId, owner, editor.email, "EDITOR")
        addMemberToList(listId, owner, viewer.email, "VIEWER")

        listOf(editor, viewer, stranger).forEach { user ->
            mockMvc.post("/api/lists/$listId/duplicate") {
                header("Authorization", bearerHeader(user))
            }.andExpect {
                status { isForbidden() }
            }
        }
    }

    @Test
    fun `POST lists - id - duplicate copies categories items assignments and parent links`() {
        val owner = createUser()
        val assignee = createUser()
        val listId = createListAsUser(owner, "Template")
        addMemberToList(listId, owner, assignee.email, "EDITOR")

        val sourceList = listRepository.findById(listId).orElseThrow()
        sourceList.emoji = "🏠"
        sourceList.description = "Household template"
        sourceList.defaultSortField = "DUE_DATE"
        sourceList.defaultSortDirection = "DESC"
        listRepository.save(sourceList)

        val groupId = createGroupAsUser(owner, "Home")
        listGroupAssignmentRepository.findByListIdAndUserId(listId, owner.id)!!.apply {
            this.groupId = groupId
            this.sortOrder = 7
        }.also { listGroupAssignmentRepository.save(it) }

        val category = categoryRepository.save(
            Category(listId = listId, name = "Cleaning", color = "#00ff00", sortOrder = 3)
        )
        val parent = itemRepository.save(
            TodoItem(
                listId = listId,
                categoryId = category.id,
                title = "Clean bathroom",
                notes = "Use vinegar",
                done = true,
                starred = true,
                dueDate = LocalDate.of(2026, 6, 20),
                recurrenceRule = RecurrenceRule(IntervalUnit.WEEKS, 2),
                createdByUserId = owner.id,
                sortOrder = 4,
            )
        )
        val child = itemRepository.save(
            TodoItem(
                listId = listId,
                categoryId = category.id,
                title = "Restock cleaner",
                notes = "Buy refill",
                done = false,
                starred = false,
                dueDate = LocalDate.of(2026, 6, 21),
                parentItemId = parent.id,
                createdByUserId = assignee.id,
                sortOrder = 5,
            )
        )
        itemAssignmentRepository.save(ItemAssignment(ItemAssignmentId(parent.id, owner.id)))
        itemAssignmentRepository.save(ItemAssignment(ItemAssignmentId(child.id, assignee.id)))

        val duplicateId = duplicateListAsUser(listId, owner)
        val duplicateList = listRepository.findById(duplicateId).orElseThrow()

        assertEquals("Template (1)", duplicateList.name)
        assertEquals("🏠", duplicateList.emoji)
        assertEquals("Household template", duplicateList.description)
        assertEquals("DUE_DATE", duplicateList.defaultSortField)
        assertEquals("DESC", duplicateList.defaultSortDirection)
        assertEquals(ListRole.OWNER, listMembershipRepository.findByListIdAndUserId(duplicateId, owner.id)?.role)
        assertEquals(ListRole.EDITOR, listMembershipRepository.findByListIdAndUserId(duplicateId, assignee.id)?.role)

        val duplicateAssignment = listGroupAssignmentRepository.findByListIdAndUserId(duplicateId, owner.id)
        assertNotNull(duplicateAssignment)
        assertEquals(groupId, duplicateAssignment.groupId)
        assertEquals(7, duplicateAssignment.sortOrder)

        val duplicateCategory = categoryRepository.findAllByListIdOrderBySortOrder(duplicateId).single()
        assertFalse(duplicateCategory.id == category.id)
        assertEquals("Cleaning", duplicateCategory.name)
        assertEquals("#00ff00", duplicateCategory.color)
        assertEquals(3, duplicateCategory.sortOrder)

        val duplicateItems = itemRepository.findAllByListId(duplicateId).associateBy { it.title }
        val duplicateParent = duplicateItems.getValue("Clean bathroom")
        val duplicateChild = duplicateItems.getValue("Restock cleaner")
        assertFalse(duplicateParent.id == parent.id)
        assertFalse(duplicateChild.id == child.id)
        assertEquals(duplicateCategory.id, duplicateParent.categoryId)
        assertEquals(duplicateCategory.id, duplicateChild.categoryId)
        assertEquals("Use vinegar", duplicateParent.notes)
        assertTrue(duplicateParent.done)
        assertTrue(duplicateParent.starred)
        assertEquals(LocalDate.of(2026, 6, 20), duplicateParent.dueDate)
        assertEquals(RecurrenceRule(IntervalUnit.WEEKS, 2), duplicateParent.recurrenceRule)
        assertEquals(owner.id, duplicateParent.createdByUserId)
        assertEquals(4, duplicateParent.sortOrder)
        assertEquals(duplicateParent.id, duplicateChild.parentItemId)
        assertEquals(assignee.id, duplicateChild.createdByUserId)
        assertEquals(listOf(owner.id), itemAssignmentRepository.findAllByIdItemId(duplicateParent.id).map { it.id.userId })
        assertEquals(listOf(assignee.id), itemAssignmentRepository.findAllByIdItemId(duplicateChild.id).map { it.id.userId })
    }

    @Test
    fun `POST lists - id - duplicate increments suffix past existing copies`() {
        val owner = createUser()
        val listId = createListAsUser(owner, "Groceries")
        createListAsUser(owner, "Groceries (1)")
        createListAsUser(owner, "Groceries (2)")

        val duplicateId = duplicateListAsUser(listId, owner)

        assertEquals("Groceries (3)", listRepository.findById(duplicateId).orElseThrow().name)
    }

    @Test
    fun `POST lists - id - duplicate increments existing copy suffix`() {
        val owner = createUser()
        createListAsUser(owner, "Groceries")
        val copiedListId = createListAsUser(owner, "Groceries (1)")

        val duplicateId = duplicateListAsUser(copiedListId, owner)

        assertEquals("Groceries (2)", listRepository.findById(duplicateId).orElseThrow().name)
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

        val idStr = JsonMapper()
            .readTree(result.response.contentAsString)["id"].asString()
        return UUID.fromString(idStr)
    }

    private fun createGroupAsUser(user: User, name: String): UUID {
        val result = mockMvc.post("/api/list-groups") {
            header("Authorization", bearerHeader(user))
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"$name"}"""
        }.andExpect { status { isCreated() } }.andReturn()

        val idStr = JsonMapper()
            .readTree(result.response.contentAsString)["id"].asString()
        return UUID.fromString(idStr)
    }

    private fun addMemberToList(listId: UUID, owner: User, email: String, role: String) {
        mockMvc.post("/api/lists/$listId/members") {
            header("Authorization", bearerHeader(owner))
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"$email","role":"$role"}"""
        }.andExpect { status { isCreated() } }
    }

    private fun duplicateListAsUser(listId: UUID, user: User): UUID {
        val result = mockMvc.post("/api/lists/$listId/duplicate") {
            header("Authorization", bearerHeader(user))
        }.andExpect {
            status { isCreated() }
        }.andReturn()

        val idStr = JsonMapper()
            .readTree(result.response.contentAsString)["id"].asString()
        return UUID.fromString(idStr)
    }
}
