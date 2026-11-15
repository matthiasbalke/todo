package com.github.matthiasbalke.todo.items

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.auth.JwtTokenService
import com.github.matthiasbalke.todo.auth.User
import com.github.matthiasbalke.todo.auth.UserRepository
import com.github.matthiasbalke.todo.sse.ListEvent
import com.github.matthiasbalke.todo.sse.SsePublisher
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import tools.jackson.databind.json.JsonMapper
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@AutoConfigureMockMvc
class CustomRecurrenceIntegrationTest : AbstractIntegrationTest() {
    @Autowired private lateinit var mvc: MockMvc
    @Autowired private lateinit var users: UserRepository
    @Autowired private lateinit var tokens: JwtTokenService
    @Autowired private lateinit var items: ItemRepository
    @Autowired private lateinit var jdbc: JdbcTemplate
    @MockitoSpyBean private lateinit var publisher: SsePublisher
    private val mapper = JsonMapper()
    private val rule = """{"intervalUnit":"WEEKS","intervalValue":2,"weekdays":["THURSDAY","MONDAY"]}"""

    private fun fixture(): Pair<User, UUID> {
        val user = users.save(User(email = "${UUID.randomUUID()}@example.com", displayName = "Recurrence", validatedAt = Instant.now()))
        val result = mvc.post("/api/lists") {
            header("Authorization", auth(user)); contentType = MediaType.APPLICATION_JSON; content = """{"name":"Recurrence"}"""
        }.andExpect { status { isCreated() } }.andReturn()
        return user to UUID.fromString(mapper.readTree(result.response.contentAsString)["id"].asString())
    }
    private fun auth(user: User) = "Bearer ${tokens.generateAccessToken(user)}"
    private fun create(user: User, list: UUID, recurrence: String = rule): UUID {
        val result = mvc.post("/api/lists/$list/items") {
            header("Authorization", auth(user)); contentType = MediaType.APPLICATION_JSON
            content = """{"title":"Task","notes":"Keep details","dueDate":"2026-11-02","sortOrder":7,"assignedUserIds":["${user.id}"],"recurrenceRule":$recurrence}"""
        }.andExpect { status { isCreated() } }.andReturn()
        return UUID.fromString(mapper.readTree(result.response.contentAsString)["id"].asString())
    }
    private fun events() = Mockito.mockingDetails(publisher).invocations
        .filter { it.method.name == "publish" }.map { it.arguments[0] as ListEvent }

    @Test
    fun `weekday rules round trip through JSONB Today title updates duplication and SSE`() {
        val (user, list) = fixture()
        val id = create(user, list)
        val expected = RecurrenceRule(IntervalUnit.WEEKS, 2, listOf(DayOfWeek.MONDAY, DayOfWeek.THURSDAY))
        assertEquals(expected, items.findById(id).orElseThrow().recurrenceRule)
        assertEquals(listOf("MONDAY", "THURSDAY"), events().filterIsInstance<ListEvent.ItemCreated>().last().item.recurrenceRule!!.weekdays)
        mvc.get("/api/today") { header("Authorization", auth(user)) }.andExpect {
            status { isOk() }; jsonPath("$[?(@.id == '$id')].recurrenceRule.weekdays[0]") { value("MONDAY") }
        }
        mvc.put("/api/lists/$list/items/$id") {
            header("Authorization", auth(user)); contentType = MediaType.APPLICATION_JSON; content = """{"title":"Renamed"}"""
        }.andExpect { status { isOk() }; jsonPath("$.recurrenceRule.weekdays[1]") { value("THURSDAY") } }
        val duplicate = mvc.post("/api/lists/$list/duplicate") { header("Authorization", auth(user)) }
            .andExpect { status { isCreated() } }.andReturn()
        val copiedList = UUID.fromString(mapper.readTree(duplicate.response.contentAsString)["id"].asString())
        assertEquals(expected, items.findAllByListId(copiedList).single().recurrenceRule)
        // Existing JSON without the optional property still loads without rewriting records.
        jdbc.update("UPDATE todo_items SET recurrence_rule = '{\"intervalUnit\":\"MONTHS\",\"intervalValue\":3}'::jsonb WHERE id = ?", id)
        assertEquals(RecurrenceRule(IntervalUnit.MONTHS, 3), items.findById(id).orElseThrow().recurrenceRule)
        val customDuplicate = mvc.post("/api/lists/$list/duplicate") { header("Authorization", auth(user)) }
            .andExpect { status { isCreated() } }.andReturn()
        val customList = UUID.fromString(mapper.readTree(customDuplicate.response.contentAsString)["id"].asString())
        assertEquals(RecurrenceRule(IntervalUnit.MONTHS, 3), items.findAllByListId(customList).single().recurrenceRule)

        mvc.put("/api/lists/$list/items/$id") {
            header("Authorization", auth(user)); contentType = MediaType.APPLICATION_JSON; content = """{"title":"Cleared","recurrenceRule":null}"""
        }.andExpect { status { isOk() }; jsonPath("$.recurrenceRule") { doesNotExist() } }
    }

    @Test
    fun `invalid create and update rules never mutate or emit item events`() {
        val (user, list) = fixture()
        val id = create(user, list)
        val original = items.findById(id).orElseThrow().recurrenceRule
        val invalid = listOf(
            """{"intervalUnit":"WEEKS","intervalValue":0}""",
            """{"intervalUnit":"DAYS","intervalValue":-1}""",
            """{"intervalUnit":"DAYS","intervalValue":1.5}""",
            """{"intervalUnit":"DAYS","intervalValue":2147483648}""",
            """{"intervalUnit":"INVALID","intervalValue":1}""",
            """{"intervalUnit":"WEEKS","intervalValue":1,"weekdays":[]}""",
            """{"intervalUnit":"WEEKS","intervalValue":1,"weekdays":["MONDAY","MONDAY"]}""",
            """{"intervalUnit":"WEEKS","intervalValue":1,"weekdays":["INVALID"]}""",
            """{"intervalUnit":"WEEKS","intervalValue":1,"weekdays":[null]}""",
            """{"intervalUnit":"MONTHS","intervalValue":1,"weekdays":["MONDAY"]}""",
        )
        invalid.forEach { bad ->
            Mockito.clearInvocations(publisher)
            mvc.post("/api/lists/$list/items") {
                header("Authorization", auth(user)); contentType = MediaType.APPLICATION_JSON; content = """{"title":"Invalid","recurrenceRule":$bad}"""
            }.andExpect { status { isBadRequest() } }
            mvc.put("/api/lists/$list/items/$id") {
                header("Authorization", auth(user)); contentType = MediaType.APPLICATION_JSON; content = """{"title":"Invalid","recurrenceRule":$bad}"""
            }.andExpect { status { isBadRequest() } }
            assertEquals(original, items.findById(id).orElseThrow().recurrenceRule)
            assertEquals("Task", items.findById(id).orElseThrow().title)
            assertEquals(1, items.findAllByListId(list).size)
            assertTrue(events().isEmpty(), bad)
        }
    }

    @Test
    fun `completion preserves details and creates a single linked successor in the active week`() {
        val (user, list) = fixture()
        val id = create(user, list)
        Mockito.clearInvocations(publisher)
        mvc.patch("/api/lists/$list/items/$id/done") { header("Authorization", auth(user)) }.andExpect { status { isOk() } }
        val next = items.findAllByListId(list).single { !it.done }
        assertEquals(LocalDate.of(2026, 11, 5), next.dueDate)
        assertEquals(id, next.parentItemId)
        assertEquals("Keep details", next.notes)
        assertEquals(7, next.sortOrder)
        assertEquals(user.id, next.createdByUserId)
        val event = events().filterIsInstance<ListEvent.ItemCreated>().single().item
        assertEquals(listOf(user.id), event.assignedUserIds)
        assertEquals(listOf("MONDAY", "THURSDAY"), event.recurrenceRule!!.weekdays)
        mvc.patch("/api/lists/$list/items/${next.id}/done") { header("Authorization", auth(user)) }.andExpect { status { isOk() } }
        assertEquals(LocalDate.of(2026, 11, 16), items.findAllByListId(list).single { !it.done }.dueDate)
    }

    @Test
    fun `date overflow rolls completion back without creating a successor or publishing events`() {
        IntervalUnit.entries.forEach { unit ->
            val (user, list) = fixture()
            val id = create(user, list, """{"intervalUnit":"$unit","intervalValue":2147483647}""")
            Mockito.clearInvocations(publisher)
            mvc.patch("/api/lists/$list/items/$id/done") { header("Authorization", auth(user)) }.andExpect { status { isBadRequest() } }
            assertFalse(items.findById(id).orElseThrow().done)
            assertEquals(1, items.findAllByListId(list).size)
            assertTrue(events().isEmpty())
        }
    }
}
