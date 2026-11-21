package com.github.matthiasbalke.todo.items

import com.github.matthiasbalke.todo.auth.UserRepository
import com.github.matthiasbalke.todo.lists.ListMembershipRepository
import com.github.matthiasbalke.todo.lists.ListRole
import jakarta.persistence.EntityManager
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.DayOfWeek
import java.util.UUID

@Service
class AgileService(
    private val repository: AgileRepository,
    private val items: ItemRepository,
    private val memberships: ListMembershipRepository,
    private val assignmentsRepository: ItemAssignmentRepository,
    private val users: UserRepository,
    private val entityManager: EntityManager,
) {
    // User rows provide a lock even when the backlog is empty. All writers use this protocol.
    fun lockUsers(userIds: Collection<UUID>) {
        userIds.distinct().sortedBy { it.toString() }.forEach {
            entityManager.createNativeQuery("SELECT id FROM users WHERE id = :id FOR UPDATE")
                .setParameter("id", it).resultList
        }
    }

    // Lock all current source-list members before completion, so concurrent first selections
    // cannot race the inheritance snapshot. Retained selections also take part in the protocol.
    fun lockForCompletion(itemId: UUID, listId: UUID) {
        @Suppress("UNCHECKED_CAST")
        val ids = entityManager.createNativeQuery("""
            SELECT user_id FROM list_memberships WHERE list_id = :listId
            UNION SELECT user_id FROM agile_item_selections WHERE item_id = :itemId
        """).setParameter("listId", listId).setParameter("itemId", itemId).resultList as List<UUID>
        lockUsers(ids)
    }

    fun inherit(parentId: UUID, successorId: UUID) {
        entityManager.flush()
        entityManager.createNativeQuery("""
            INSERT INTO agile_item_selections(user_id, item_id, position)
            SELECT p.user_id, :successorId,
                   (SELECT COALESCE(MAX(s.position), -1) + 1 FROM agile_item_selections s WHERE s.user_id = p.user_id)
            FROM agile_item_selections p WHERE p.item_id = :parentId
        """).setParameter("parentId", parentId).setParameter("successorId", successorId).executeUpdate()
    }

    @Transactional(readOnly = true)
    fun getItems(userId: UUID): List<TodayItem> {
        val rows = repository.findEntries(userId)
        val assigned = assignmentsRepository.findAllByIdItemIdIn(rows.map { it.id })
        val userMap = users.findAllById(assigned.map { it.id.userId }.distinct()).associateBy { it.id }
        val assignments = assigned.groupBy({ it.id.itemId }, {
            val user = userMap.getValue(it.id.userId)
            TodayAssignedUser(user.id, user.displayName)
        })
        return rows.map { row ->
            TodayItem(
                item = TodoItem(
                    id = row.id,
                    listId = row.listId,
                    categoryId = row.categoryId,
                    title = row.title,
                    notes = row.notes,
                    done = row.done,
                    starred = row.starred,
                    dueDate = row.dueDate,
                    recurrenceRule = row.recurrenceIntervalUnit?.let { intervalUnit ->
                        RecurrenceRule(
                            intervalUnit = IntervalUnit.valueOf(intervalUnit),
                            intervalValue = row.recurrenceIntervalValue
                                ?: throw IllegalStateException("Recurring item is missing intervalValue"),
                            weekdays = row.recurrenceWeekdays?.takeIf { it.isNotEmpty() }?.split(",")?.map(DayOfWeek::valueOf),
                        )
                    },
                    parentItemId = row.parentItemId,
                    createdByUserId = row.createdByUserId,
                    updatedByUserId = row.updatedByUserId,
                    sortOrder = row.sortOrder,
                    createdAt = row.createdAt,
                    updatedAt = row.updatedAt,
                ),
                assignedUsers = assignments[row.id].orEmpty(),
                sourceListName = row.sourceListName,
                sourceListEmoji = row.sourceListEmoji,
                sourceListRole = ListRole.valueOf(row.sourceListRole),
                sourceListGroupOrder = row.sourceListGroupOrder,
                sourceListOrder = row.sourceListOrder,
                sourceCategoryName = row.sourceCategoryName,
                sourceCategoryColor = row.sourceCategoryColor,
                sourceCategoryOrder = row.sourceCategoryOrder,
            )
        }
    }

    fun count(userId: UUID): Long = repository.countUnfinished(userId)

    @Transactional
    fun select(userId: UUID, itemId: UUID, selected: Boolean): Long {
        lockUsers(listOf(userId))
        val item = items.findById(itemId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
        if (memberships.findByListIdAndUserId(item.listId, userId) == null)
            throw ResponseStatusException(HttpStatus.NOT_FOUND)
        val id = AgileSelectionId(userId, itemId)
        if (selected && !repository.existsById(id)) {
            val position = repository.findAllByIdUserIdOrderByPositionAscIdItemIdAsc(userId).maxOfOrNull { it.position }?.plus(1) ?: 0
            repository.save(AgileSelection(id, position))
        } else if (!selected) repository.deleteById(id)
        repository.flush()
        return count(userId)
    }

    @Transactional
    fun reorder(userId: UUID, itemIds: List<UUID>) {
        if (itemIds.distinct().size != itemIds.size)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate item IDs")
        lockUsers(listOf(userId))
        val accessible = repository.findEntries(userId).filter { !it.done }.map { it.id }.toSet()
        if (itemIds.toSet() != accessible)
            throw ResponseStatusException(HttpStatus.CONFLICT, "Your backlog changed. Refresh and try again.")
        val stored = repository.findAllByIdUserIdOrderByPositionAscIdItemIdAsc(userId)
        val byId = stored.associateBy { it.id.itemId }
        val ordered = itemIds.iterator()
        stored.map { if (it.id.itemId in accessible) byId.getValue(ordered.next()) else it }
            .forEachIndexed { index, selection -> selection.position = index.toLong() }
        repository.flush()
    }
}
