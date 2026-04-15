package com.github.matthiasbalke.todo.push

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.auth.User
import com.github.matthiasbalke.todo.auth.UserRepository
import com.github.matthiasbalke.todo.items.ItemAssignment
import com.github.matthiasbalke.todo.items.ItemAssignmentId
import com.github.matthiasbalke.todo.items.ItemAssignmentRepository
import com.github.matthiasbalke.todo.items.ItemRepository
import com.github.matthiasbalke.todo.items.TodoItem
import com.github.matthiasbalke.todo.lists.ListRepository
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import java.time.LocalDate
import java.util.UUID

class PushSchedulerTest : AbstractIntegrationTest() {

    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var listRepository: ListRepository
    @Autowired private lateinit var itemRepository: ItemRepository
    @Autowired private lateinit var itemAssignmentRepository: ItemAssignmentRepository
    @Autowired private lateinit var pushSubscriptionRepository: PushSubscriptionRepository

    private lateinit var mockPushDispatchService: PushDispatchService
    private lateinit var scheduler: PushScheduler

    @BeforeEach
    fun setup() {
        mockPushDispatchService = mockk(relaxed = true)
        scheduler = PushScheduler(itemRepository, itemAssignmentRepository, mockPushDispatchService)
    }

    private fun createUser(): User =
        userRepository.save(User(email = "sched-${UUID.randomUUID()}@example.com", displayName = "Sched User"))

    private fun createList(): UUID =
        listRepository.save(com.github.matthiasbalke.todo.lists.List(name = "Test List")).id

    private fun createItem(
        userId: UUID,
        listId: UUID,
        dueDate: LocalDate?,
        done: Boolean = false,
    ): TodoItem {
        val item = itemRepository.save(
            TodoItem(
                listId = listId,
                title = "Test Item",
                dueDate = dueDate,
                done = done,
                createdByUserId = userId,
            )
        )
        itemAssignmentRepository.save(ItemAssignment(ItemAssignmentId(item.id, userId)))
        return item
    }

    @Test
    fun `sendDailyReminders - notifies user for item due today`() {
        val user = createUser()
        val listId = createList()
        val item = createItem(user.id, listId, LocalDate.now())

        scheduler.sendDailyReminders()

        verify { mockPushDispatchService.send(user.id, "Task due today", item.title, any()) }
    }

    @Test
    fun `sendDailyReminders - notifies user for overdue item`() {
        val user = createUser()
        val listId = createList()
        val item = createItem(user.id, listId, LocalDate.now().minusDays(1))

        scheduler.sendDailyReminders()

        verify { mockPushDispatchService.send(user.id, "Overdue task", item.title, any()) }
    }

    @Test
    fun `sendDailyReminders - does not notify for done items`() {
        val user = createUser()
        val listId = createList()
        createItem(user.id, listId, LocalDate.now(), done = true)
        createItem(user.id, listId, LocalDate.now().minusDays(1), done = true)

        scheduler.sendDailyReminders()

        verify(exactly = 0) { mockPushDispatchService.send(user.id, any(), any(), any()) }
    }
}
