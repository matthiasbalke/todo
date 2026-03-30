package com.github.matthiasbalke.todo.items

import com.github.matthiasbalke.todo.lists.ListAccessService
import com.github.matthiasbalke.todo.lists.ListRole
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreateItemRequest(
    val title: String,
    val notes: String? = null,
    val categoryId: UUID? = null,
    val dueDate: LocalDate? = null,
    val starred: Boolean = false,
    val recurrenceRule: RecurrenceRule? = null,
    val assignedUserIds: List<UUID> = emptyList(),
    val sortOrder: Int = 0,
)

data class UpdateItemRequest(
    val title: String,
    val notes: String? = null,
    val categoryId: UUID? = null,
    val dueDate: LocalDate? = null,
    val starred: Boolean = false,
    val recurrenceRule: RecurrenceRule? = null,
    val assignedUserIds: List<UUID> = emptyList(),
    val sortOrder: Int = 0,
)

data class ItemWithAssignees(
    val item: TodoItem,
    val assignedUserIds: List<UUID>,
)

@Service
class ItemService(
    private val itemRepository: ItemRepository,
    private val itemAssignmentRepository: ItemAssignmentRepository,
    private val listAccessService: ListAccessService,
) {

    fun getItems(listId: UUID, userId: UUID): List<ItemWithAssignees> {
        listAccessService.requireMembership(listId, userId)
        val items = itemRepository.findAllByListId(listId)
        return items.map { it.withAssignees() }
    }

    fun getItem(listId: UUID, itemId: UUID, userId: UUID): ItemWithAssignees {
        listAccessService.requireMembership(listId, userId)
        val item = itemRepository.findByIdAndListId(itemId, listId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found")
        return item.withAssignees()
    }

    @Transactional
    fun createItem(listId: UUID, userId: UUID, req: CreateItemRequest): ItemWithAssignees {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        val item = itemRepository.save(
            TodoItem(
                listId = listId,
                categoryId = req.categoryId,
                title = req.title,
                notes = req.notes,
                starred = req.starred,
                dueDate = req.dueDate,
                recurrenceRule = req.recurrenceRule,
                createdByUserId = userId,
                sortOrder = req.sortOrder,
            )
        )
        saveAssignments(item.id, req.assignedUserIds)
        return item.withAssignees()
    }

    @Transactional
    fun updateItem(listId: UUID, itemId: UUID, userId: UUID, req: UpdateItemRequest): ItemWithAssignees {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        val item = itemRepository.findByIdAndListId(itemId, listId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found")
        item.title = req.title
        item.notes = req.notes
        item.categoryId = req.categoryId
        item.dueDate = req.dueDate
        item.starred = req.starred
        item.recurrenceRule = req.recurrenceRule
        item.sortOrder = req.sortOrder
        item.updatedAt = Instant.now()
        itemRepository.save(item)
        itemAssignmentRepository.deleteAllByIdItemId(itemId)
        saveAssignments(itemId, req.assignedUserIds)
        return item.withAssignees()
    }

    @Transactional
    fun deleteItem(listId: UUID, itemId: UUID, userId: UUID) {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        itemRepository.findByIdAndListId(itemId, listId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found")
        itemRepository.deleteById(itemId)
    }

    @Transactional
    fun toggleDone(listId: UUID, itemId: UUID, userId: UUID): ItemWithAssignees {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        val item = itemRepository.findByIdAndListId(itemId, listId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found")
        item.done = !item.done
        item.updatedAt = Instant.now()
        itemRepository.save(item)

        if (item.done && item.recurrenceRule != null) {
            val rule = item.recurrenceRule!!
            val base = item.dueDate ?: LocalDate.now()
            val nextDue = when (rule.intervalUnit) {
                IntervalUnit.DAYS -> base.plusDays(rule.intervalValue.toLong())
                IntervalUnit.WEEKS -> base.plusWeeks(rule.intervalValue.toLong())
                IntervalUnit.MONTHS -> base.plusMonths(rule.intervalValue.toLong())
                IntervalUnit.YEARS -> base.plusYears(rule.intervalValue.toLong())
            }
            val assignees = itemAssignmentRepository.findAllByIdItemId(itemId).map { it.id.userId }
            val next = itemRepository.save(
                TodoItem(
                    listId = listId,
                    categoryId = item.categoryId,
                    title = item.title,
                    notes = item.notes,
                    recurrenceRule = item.recurrenceRule,
                    parentItemId = itemId,
                    createdByUserId = item.createdByUserId,
                    dueDate = nextDue,
                    sortOrder = item.sortOrder,
                )
            )
            saveAssignments(next.id, assignees)
        }

        return item.withAssignees()
    }

    @Transactional
    fun toggleStarred(listId: UUID, itemId: UUID, userId: UUID): ItemWithAssignees {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        val item = itemRepository.findByIdAndListId(itemId, listId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found")
        item.starred = !item.starred
        item.updatedAt = Instant.now()
        itemRepository.save(item)
        return item.withAssignees()
    }

    @Transactional
    fun updateOrder(listId: UUID, itemId: UUID, userId: UUID, sortOrder: Int): ItemWithAssignees {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        val item = itemRepository.findByIdAndListId(itemId, listId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found")
        item.sortOrder = sortOrder
        item.updatedAt = Instant.now()
        itemRepository.save(item)
        return item.withAssignees()
    }

    private fun saveAssignments(itemId: UUID, userIds: List<UUID>) {
        userIds.forEach { uid ->
            itemAssignmentRepository.save(ItemAssignment(ItemAssignmentId(itemId, uid)))
        }
    }

    private fun TodoItem.withAssignees(): ItemWithAssignees {
        val assignees = itemAssignmentRepository.findAllByIdItemId(id).map { it.id.userId }
        return ItemWithAssignees(this, assignees)
    }
}
