package com.github.matthiasbalke.todo.items

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.auth.JwtTokenService
import com.github.matthiasbalke.todo.auth.User
import com.github.matthiasbalke.todo.auth.UserRepository
import com.github.matthiasbalke.todo.lists.ListMembership
import com.github.matthiasbalke.todo.lists.ListMembershipId
import com.github.matthiasbalke.todo.lists.ListMembershipRepository
import com.github.matthiasbalke.todo.lists.ListRepository
import com.github.matthiasbalke.todo.lists.ListService
import com.github.matthiasbalke.todo.lists.ListRole
import com.github.matthiasbalke.todo.lists.List as TodoList
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.put
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.transaction.PlatformTransactionManager
import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeoutException
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@AutoConfigureMockMvc
class AgileIntegrationTest : AbstractIntegrationTest() {
    @Autowired lateinit var mvc: MockMvc
    @Autowired lateinit var users: UserRepository
    @Autowired lateinit var lists: ListRepository
    @Autowired lateinit var members: ListMembershipRepository
    @Autowired lateinit var items: ItemRepository
    @Autowired lateinit var assignments: ItemAssignmentRepository
    @Autowired lateinit var selections: AgileRepository
    @Autowired lateinit var service: AgileService
    @Autowired lateinit var itemService: ItemService
    @Autowired lateinit var jwt: JwtTokenService
    @Autowired lateinit var jdbc: JdbcTemplate
    @Autowired lateinit var listService: ListService
    @Autowired lateinit var transactions: PlatformTransactionManager

    fun user() = users.save(User(email = "${UUID.randomUUID()}@example.com", displayName = "Planner", validatedAt = Instant.now()))
    fun list(user: User, role: ListRole = ListRole.OWNER) = lists.save(TodoList(name = "Source")).also {
        members.save(ListMembership(it.id, user.id, role))
    }
    fun item(list: TodoList, title: String = "Task") = items.save(TodoItem(listId = list.id, title = title))
    fun auth(user: User) = "Bearer ${jwt.generateAccessToken(user)}"
    fun ids(user: User) = service.getItems(user.id).map { it.item.id }
    fun select(user: User, item: TodoItem, selected: Boolean = true) = service.select(user.id, item.id, selected)

    @Test fun `personal selections include undated and other assigned items with source capabilities and counts`() {
        val user = user(); val other = user(); val source = list(user); val viewed = list(user, ListRole.VIEWER)
        val a = item(source); val b = item(viewed)
        assignments.save(ItemAssignment(ItemAssignmentId(a.id, other.id)))
        b.done = true; items.save(b)
        select(user, a); select(user, b)
        mvc.get("/api/agile") { header("Authorization", auth(user)) }.andExpect {
            status { isOk() }; jsonPath("$.length()") { value(2) }
            jsonPath("$[0].assignedUsers[0].id") { value(other.id.toString()) }
            jsonPath("$[1].sourceListRole") { value("VIEWER") }
        }
        mvc.get("/api/agile/count") { header("Authorization", auth(user)) }.andExpect {
            status { isOk() }; jsonPath("$.count") { value(1) }
        }
        assertEquals(emptyList<UUID>(), ids(other))
        mvc.put("/api/agile/items/${a.id}") {
            header("Authorization", auth(other)); contentType = MediaType.APPLICATION_JSON; content = "{\"selected\":true}"
        }.andExpect { status { isNotFound() } }
        mvc.get("/api/agile").andExpect { status { isForbidden() } }
    }

    @Test fun `idempotent selection and reselect append without modifying source fields`() {
        val user = user(); val list = list(user, ListRole.VIEWER); val a = item(list); val b = item(list)
        val before = items.findById(a.id).get()
        select(user, a); select(user, b); select(user, a)
        assertEquals(listOf(a.id, b.id), ids(user))
        select(user, a, false); assertTrue(items.existsById(a.id)); select(user, a)
        assertEquals(listOf(b.id, a.id), ids(user))
        val after = items.findById(a.id).get()
        assertEquals(before.updatedAt, after.updatedAt); assertEquals(before.updatedByUserId, after.updatedByUserId)
        assertEquals(before.sortOrder, after.sortOrder); assertEquals(before.title, after.title)
    }

    @Test fun `unfinished reorder retains checked and inaccessible slots and rejects stale sets atomically`() {
        val user = user(); val source = list(user); val hidden = list(user)
        val a = item(source, "A"); val b = item(source, "B"); val c = item(source, "C"); val h = item(hidden, "Hidden")
        listOf(a,b,h,c).forEach { select(user,it) }
        itemService.toggleDone(source.id,b.id,user.id)
        members.deleteById(ListMembershipId(hidden.id,user.id))
        service.reorder(user.id,listOf(c.id,a.id))
        assertEquals(listOf(c.id,b.id,a.id),ids(user))
        mvc.put("/api/agile/order") {
            header("Authorization",auth(user)); contentType = MediaType.APPLICATION_JSON
            content = "{\"itemIds\":[\"${a.id}\",\"${a.id}\"]}"
        }.andExpect { status { isBadRequest() } }
        mvc.put("/api/agile/order") {
            header("Authorization",auth(user)); contentType = MediaType.APPLICATION_JSON
            content = "{\"itemIds\":[\"${a.id}\"]}"
        }.andExpect { status { isConflict() } }
        assertEquals(listOf(c.id,b.id,a.id),ids(user))
        itemService.toggleDone(source.id,b.id,user.id)
        members.save(ListMembership(hidden.id,user.id,ListRole.VIEWER))
        assertEquals(listOf(c.id,b.id,h.id,a.id),ids(user))
        assertTrue(items.findAllById(listOf(a.id,b.id,c.id)).all { it.sortOrder == 0 })
    }

    @Test fun `recurrence inherits immediate parent selections for disabled users and removals stop inheritance`() {
        val user = user(); val other = user(); val actor = user(); val source = list(actor)
        listOf(user,other).forEach { members.save(ListMembership(source.id,it.id,ListRole.VIEWER)) }
        val recurring = items.save(TodoItem(listId = source.id, title = "Recurring", dueDate = LocalDate.of(2026,1,1), recurrenceRule = RecurrenceRule(IntervalUnit.DAYS,1)))
        val existing = item(source)
        select(user,recurring); select(other,recurring); select(user,existing)
        itemService.toggleDone(source.id,recurring.id,actor.id)
        val successor = items.findAllByListId(source.id).single { it.parentItemId == recurring.id }
        assertEquals(listOf(recurring.id,existing.id,successor.id),ids(user))
        assertEquals(listOf(recurring.id,successor.id),ids(other)); assertFalse(users.findById(user.id).get().agileViewEnabled)
        select(user,successor,false)
        itemService.toggleDone(source.id,successor.id,actor.id)
        val next = items.findAllByListId(source.id).single { it.parentItemId == successor.id }
        assertFalse(next.id in ids(user)); assertTrue(next.id in ids(other))
        assertTrue(recurring.id in ids(user))
    }

    @Test fun `recurrence selection inheritance rolls back together with source completion`() {
        val user = user(); val source = list(user)
        val recurring = items.save(TodoItem(listId = source.id,title = "Recurring",recurrenceRule = RecurrenceRule(IntervalUnit.DAYS,1)))
        select(user,recurring)
        TransactionTemplate(transactions).executeWithoutResult { tx ->
            itemService.toggleDone(source.id,recurring.id,user.id); tx.setRollbackOnly()
        }
        assertFalse(items.findById(recurring.id).get().done)
        assertEquals(listOf(recurring.id),items.findAllByListId(source.id).map { it.id })
        assertEquals(listOf(recurring.id),ids(user))
    }

    @Test fun `item list and user deletion cascade and selection primary key is unique`() {
        val user = user(); val source = list(user); val a = item(source)
        select(user,a); select(user,a)
        assertThrows(DataIntegrityViolationException::class.java) {
            jdbc.update("INSERT INTO agile_item_selections(user_id, item_id, position) VALUES (?, ?, ?)", user.id, a.id, 99)
        }
        assertEquals(1,selections.findAllByIdUserIdOrderByPositionAscIdItemIdAsc(user.id).size)
        itemService.deleteItem(source.id,a.id,user.id)
        assertEquals(0,selections.findAllByIdUserIdOrderByPositionAscIdItemIdAsc(user.id).size)
        val b = item(source); select(user,b); lists.deleteById(source.id)
        assertEquals(0,selections.findAllByIdUserIdOrderByPositionAscIdItemIdAsc(user.id).size)
        val owner = user(); val retained = list(owner); val c = item(retained)
        members.save(ListMembership(retained.id, user.id, ListRole.VIEWER))
        select(user,c); users.deleteById(user.id)
        assertEquals(0,selections.findAllByIdUserIdOrderByPositionAscIdItemIdAsc(user.id).size)
        assertTrue(items.existsById(c.id))
    }

    @Test fun `parallel append operations serialize and same set reorders use last successful order`() {
        val user = user(); val source = list(user); val a = item(source); val b = item(source)
        val pool = Executors.newFixedThreadPool(2)
        try {
            val jobs = listOf(a,b).map { pool.submit { select(user,it) } }
            jobs.forEach { it.get(15,TimeUnit.SECONDS) }
        } finally { pool.shutdownNow() }
        assertEquals(2, ids(user).toSet().size)
        assertEquals(listOf(0L,1L),selections.findAllByIdUserIdOrderByPositionAscIdItemIdAsc(user.id).map { it.position })
        service.reorder(user.id,listOf(b.id,a.id)); service.reorder(user.id,listOf(a.id,b.id))
        assertEquals(listOf(a.id,b.id),ids(user))
    }

    @Test fun `Agile preference defaults false persists and omitted field preserves enabled value`() {
        val user = user(); val other = user()
        assertFalse(user.agileViewEnabled)
        mvc.get("/api/users/me") { header("Authorization",auth(user)) }.andExpect { jsonPath("$.agileViewEnabled") { value(false) } }
        mvc.put("/api/users/me/preferences") {
            header("Authorization",auth(user)); contentType = MediaType.APPLICATION_JSON
            content = """{"timeZone":"UTC","todayViewEnabled":false,"themePreference":"DARK","agileViewEnabled":true}"""
        }.andExpect { status { isOk() }; jsonPath("$.agileViewEnabled") { value(true) } }
        mvc.put("/api/users/me/preferences") {
            header("Authorization",auth(user)); contentType = MediaType.APPLICATION_JSON
            content = """{"timeZone":"Europe/Berlin","todayViewEnabled":true,"themePreference":"LIGHT"}"""
        }.andExpect { status { isOk() }; jsonPath("$.agileViewEnabled") { value(true) }; jsonPath("$.todayViewEnabled") { value(true) } }
        assertFalse(users.findById(other.id).get().agileViewEnabled)
    }
    @Test fun `duplicating a list never copies personal selections`() {
        val user = user(); val source = list(user); val a = item(source)
        select(user, a)
        val duplicate = listService.duplicateList(source.id, user.id)
        assertEquals(1, items.findAllByListId(duplicate.id).size)
        assertEquals(listOf(a.id), ids(user))
    }

    @Test fun `concurrent reorder append and completion serialize without losing selections`() {
        val user = user(); val source = list(user); val a = item(source); val b = item(source); val c = item(source)
        select(user, a); select(user, b)
        val pool = Executors.newSingleThreadExecutor()
        try {
            var append: java.util.concurrent.Future<*>? = null
            TransactionTemplate(transactions).executeWithoutResult {
                service.lockUsers(listOf(user.id))
                val started = CountDownLatch(1)
                append = pool.submit { started.countDown(); select(user, c) }
                assertTrue(started.await(10, TimeUnit.SECONDS))
                assertThrows(TimeoutException::class.java) { append!!.get(150, TimeUnit.MILLISECONDS) }
                service.reorder(user.id, listOf(b.id, a.id))
            }
            append!!.get(15, TimeUnit.SECONDS)
            assertEquals(listOf(b.id, a.id, c.id), ids(user))
            var completion: java.util.concurrent.Future<*>? = null
            TransactionTemplate(transactions).executeWithoutResult {
                service.lockUsers(listOf(user.id))
                val started = CountDownLatch(1)
                completion = pool.submit { started.countDown(); itemService.toggleDone(source.id, b.id, user.id) }
                assertTrue(started.await(10, TimeUnit.SECONDS))
                assertThrows(TimeoutException::class.java) { completion!!.get(150, TimeUnit.MILLISECONDS) }
                service.reorder(user.id, listOf(c.id, b.id, a.id))
            }
            completion!!.get(15, TimeUnit.SECONDS)
            mvc.put("/api/agile/order") {
                header("Authorization", auth(user)); contentType = MediaType.APPLICATION_JSON
                content = """{"itemIds":["${c.id}","${b.id}","${a.id}"]}"""
            }.andExpect { status { isConflict() } }
            assertEquals(listOf(c.id, b.id, a.id), ids(user))
        } finally { pool.shutdownNow() }
    }

    @Test fun `selection removal racing recurring completion is inherited atomically`() {
        val user = user(); val source = list(user)
        val parent = items.save(TodoItem(listId = source.id, title = "Recurring", recurrenceRule = RecurrenceRule(IntervalUnit.DAYS, 1)))
        select(user, parent)
        val pool = Executors.newSingleThreadExecutor()
        try {
            var completion: java.util.concurrent.Future<*>? = null
            TransactionTemplate(transactions).executeWithoutResult {
                service.lockUsers(listOf(user.id))
                val started = CountDownLatch(1)
                completion = pool.submit { started.countDown(); itemService.toggleDone(source.id, parent.id, user.id) }
                assertTrue(started.await(10, TimeUnit.SECONDS))
                assertThrows(TimeoutException::class.java) { completion!!.get(150, TimeUnit.MILLISECONDS) }
                select(user, parent, false)
            }
            completion!!.get(15, TimeUnit.SECONDS)
            assertEquals(2, items.findAllByListId(source.id).size)
            assertEquals(emptyList<UUID>(), ids(user))
        } finally { pool.shutdownNow() }
    }

}
