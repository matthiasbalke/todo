package com.github.matthiasbalke.todo.items

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.auth.User
import com.github.matthiasbalke.todo.auth.UserRepository
import com.github.matthiasbalke.todo.lists.ListMembership
import com.github.matthiasbalke.todo.lists.ListMembershipRepository
import com.github.matthiasbalke.todo.lists.ListRepository
import com.github.matthiasbalke.todo.lists.ListRole
import com.github.matthiasbalke.todo.lists.List as TodoList
import jakarta.persistence.EntityManager
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.JdbcTemplate
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals

class RecurrenceRuleHibernateMappingIntegrationTest : AbstractIntegrationTest() {

    @Autowired private lateinit var entityManager: EntityManager
    @Autowired private lateinit var jdbcTemplate: JdbcTemplate
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var listRepository: ListRepository
    @Autowired private lateinit var membershipRepository: ListMembershipRepository
    @Autowired private lateinit var itemRepository: ItemRepository
    @Autowired private lateinit var assignmentRepository: ItemAssignmentRepository
    @Autowired private lateinit var todayRepository: TodayRepository

    @Test
    fun `recurrence rule persists as JSONB and reloads through Hibernate JSON mapping`() {
        val sourceList = createList()
        val item = itemRepository.saveAndFlush(
            TodoItem(
                listId = sourceList.id,
                title = "Recurring task",
                dueDate = LocalDate.of(2026, 9, 3),
                recurrenceRule = RecurrenceRule(IntervalUnit.WEEKS, 2),
            )
        )
        entityManager.clear()

        assertEquals("jsonb", jsonColumnType(item.id))
        assertEquals("WEEKS", jsonText(item.id, "intervalUnit"))
        assertEquals(2, jsonInt(item.id, "intervalValue"))
        assertEquals(
            RecurrenceRule(IntervalUnit.WEEKS, 2),
            itemRepository.findById(item.id).orElseThrow().recurrenceRule,
        )
    }

    @Test
    fun `recurrence rule can be cleared to null through Hibernate JSON mapping`() {
        val sourceList = createList()
        val item = itemRepository.saveAndFlush(
            TodoItem(
                listId = sourceList.id,
                title = "Recurring task",
                recurrenceRule = RecurrenceRule(IntervalUnit.MONTHS, 1),
            )
        )

        item.recurrenceRule = null
        itemRepository.saveAndFlush(item)
        entityManager.clear()

        assertEquals(null, recurrenceRuleColumn(item.id))
        assertEquals(null, itemRepository.findById(item.id).orElseThrow().recurrenceRule)
    }

    @Test
    fun `today native JSONB projection reads recurrence rule keys written by Hibernate`() {
        val user = userRepository.save(
            User(
                email = "${UUID.randomUUID()}@example.com",
                displayName = "Today User",
                timeZone = "UTC",
                timeZoneInitialized = true,
            )
        )
        val sourceList = createList(user)
        val item = itemRepository.saveAndFlush(
            TodoItem(
                listId = sourceList.id,
                title = "Today recurring task",
                dueDate = LocalDate.now(),
                recurrenceRule = RecurrenceRule(IntervalUnit.YEARS, 3),
            )
        )
        assignmentRepository.save(ItemAssignment(ItemAssignmentId(item.id, user.id)))

        val projectedItem = todayRepository.findTodayItems(user.id, LocalDate.now()).single()

        assertEquals("YEARS", projectedItem.recurrenceIntervalUnit)
        assertEquals(3, projectedItem.recurrenceIntervalValue)
    }

    private fun createList(user: User? = null): TodoList =
        listRepository.save(TodoList(name = "Source")).also { sourceList ->
            if (user != null) {
                membershipRepository.save(ListMembership(sourceList.id, user.id, ListRole.OWNER))
            }
        }

    private fun jsonColumnType(itemId: UUID): String =
        jdbcTemplate.queryForObject(
            "SELECT pg_typeof(recurrence_rule)::text FROM todo_items WHERE id = ?",
            String::class.java,
            itemId,
        )!!

    private fun jsonText(itemId: UUID, key: String): String? =
        jdbcTemplate.queryForObject(
            "SELECT recurrence_rule ->> ? FROM todo_items WHERE id = ?",
            String::class.java,
            key,
            itemId,
        )

    private fun jsonInt(itemId: UUID, key: String): Int? =
        jdbcTemplate.queryForObject(
            "SELECT CAST(recurrence_rule ->> ? AS integer) FROM todo_items WHERE id = ?",
            Int::class.javaObjectType,
            key,
            itemId,
        )

    private fun recurrenceRuleColumn(itemId: UUID): String? =
        jdbcTemplate.queryForObject(
            "SELECT recurrence_rule::text FROM todo_items WHERE id = ?",
            String::class.java,
            itemId,
        )
}
