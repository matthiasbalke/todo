package com.github.matthiasbalke.todo.items

import com.github.matthiasbalke.todo.lists.ListAccessService
import com.github.matthiasbalke.todo.lists.ListRole
import com.github.matthiasbalke.todo.sse.ItemPayload
import com.github.matthiasbalke.todo.sse.ListEvent
import com.github.matthiasbalke.todo.sse.RecurrenceRulePayload
import com.github.matthiasbalke.todo.sse.SsePublisher
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
    private val ssePublisher: SsePublisher,
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
                updatedByUserId = userId,
                sortOrder = req.sortOrder,
            )
        )
        saveAssignments(item.id, req.assignedUserIds)
        return item.withAssignees().also { ssePublisher.publish(ListEvent.ItemCreated(listId, it.toPayload())) }
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
        item.updatedByUserId = userId
        itemRepository.save(item)
        itemAssignmentRepository.deleteAllByIdItemId(itemId)
        saveAssignments(itemId, req.assignedUserIds)
        return item.withAssignees().also { ssePublisher.publish(ListEvent.ItemUpdated(listId, it.toPayload())) }
    }

    @Transactional
    fun deleteItem(listId: UUID, itemId: UUID, userId: UUID) {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        itemRepository.findByIdAndListId(itemId, listId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found")
        itemRepository.deleteById(itemId)
        ssePublisher.publish(ListEvent.ItemDeleted(listId, itemId))
    }

    @Transactional
    fun deleteFinishedItems(listId: UUID, userId: UUID) {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        val deletedItemIds = itemRepository.findAllByListIdAndDone(listId, true).map { it.id }
        if (deletedItemIds.isEmpty()) return

        itemRepository.deleteAllByListIdAndDone(listId, true)
        deletedItemIds.forEach { itemId ->
            ssePublisher.publish(ListEvent.ItemDeleted(listId, itemId))
        }
    }

    @Transactional
    fun toggleDone(listId: UUID, itemId: UUID, userId: UUID): ItemWithAssignees {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        val item = itemRepository.findByIdAndListId(itemId, listId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found")
        item.done = !item.done
        item.updatedAt = Instant.now()
        item.updatedByUserId = userId
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
                    updatedByUserId = userId,
                    dueDate = nextDue,
                    sortOrder = item.sortOrder,
                )
            )
            saveAssignments(next.id, assignees)
            ssePublisher.publish(ListEvent.ItemCreated(listId, ItemWithAssignees(next, assignees).toPayload()))
        }

        return item.withAssignees().also { ssePublisher.publish(ListEvent.ItemUpdated(listId, it.toPayload())) }
    }

    @Transactional
    fun toggleStarred(listId: UUID, itemId: UUID, userId: UUID): ItemWithAssignees {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        val item = itemRepository.findByIdAndListId(itemId, listId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found")
        item.starred = !item.starred
        item.updatedAt = Instant.now()
        item.updatedByUserId = userId
        itemRepository.save(item)
        return item.withAssignees().also { ssePublisher.publish(ListEvent.ItemUpdated(listId, it.toPayload())) }
    }

    @Transactional
    fun updateOrder(listId: UUID, itemId: UUID, userId: UUID, sortOrder: Int): ItemWithAssignees {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        val item = itemRepository.findByIdAndListId(itemId, listId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found")
        item.sortOrder = sortOrder
        item.updatedAt = Instant.now()
        item.updatedByUserId = userId
        itemRepository.save(item)
        return item.withAssignees().also { ssePublisher.publish(ListEvent.ItemUpdated(listId, it.toPayload())) }
    }

    @Transactional
    fun reorderItems(listId: UUID, userId: UUID, entries: List<Pair<UUID, Int>>) {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        val ids = entries.map { it.first }
        val items = itemRepository.findAllByListIdAndIdIn(listId, ids)
        val orderMap = entries.toMap()
        val now = Instant.now()
        items.forEach { item ->
            item.sortOrder = orderMap[item.id] ?: item.sortOrder
            item.updatedAt = now
            item.updatedByUserId = userId
        }
        itemRepository.saveAll(items)
        items.forEach { item ->
            val assignees = itemAssignmentRepository.findAllByIdItemId(item.id).map { it.id.userId }
            ssePublisher.publish(ListEvent.ItemUpdated(listId, ItemWithAssignees(item, assignees).toPayload()))
        }
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

    private fun ItemWithAssignees.toPayload() = ItemPayload(
        id = item.id,
        listId = item.listId,
        categoryId = item.categoryId,
        title = item.title,
        notes = item.notes,
        done = item.done,
        starred = item.starred,
        dueDate = item.dueDate,
        recurrenceRule = item.recurrenceRule?.let { RecurrenceRulePayload(it.intervalUnit.name, it.intervalValue) },
        parentItemId = item.parentItemId,
        createdByUserId = item.createdByUserId,
        updatedByUserId = item.updatedByUserId,
        assignedUserIds = assignedUserIds,
        sortOrder = item.sortOrder,
        createdAt = item.createdAt,
        updatedAt = item.updatedAt,
    )
}
