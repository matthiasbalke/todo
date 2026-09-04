package com.github.matthiasbalke.todo.items

import com.github.matthiasbalke.todo.auth.UserRepository
import com.github.matthiasbalke.todo.lists.ListRole
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

data class TodayAssignedUser(val id: UUID, val displayName: String)

data class TodayItem(
    val item: TodoItem,
    val assignedUsers: List<TodayAssignedUser>,
    val sourceListName: String,
    val sourceListEmoji: String?,
    val sourceListRole: ListRole,
    val sourceListGroupOrder: Int?,
    val sourceListOrder: Int?,
    val sourceCategoryName: String?,
    val sourceCategoryColor: String?,
    val sourceCategoryOrder: Int?,
)

@Service
class TodayService(
    private val userRepository: UserRepository,
    private val todayRepository: TodayRepository,
    private val itemAssignmentRepository: ItemAssignmentRepository,
) {
    fun getItems(userId: UUID): List<TodayItem> {
        val today = currentDate(userId)
        return todayRepository.findTodayItems(userId, today).map { row ->
            val assignedUsers = itemAssignmentRepository.findAssignedUsers(row.id)
                .map { TodayAssignedUser(it.id, it.displayName) }
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
                        )
                    },
                    parentItemId = row.parentItemId,
                    createdByUserId = row.createdByUserId,
                    updatedByUserId = row.updatedByUserId,
                    sortOrder = row.sortOrder,
                    createdAt = row.createdAt,
                    updatedAt = row.updatedAt,
                ),
                assignedUsers = assignedUsers,
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

    fun countUnfinished(userId: UUID): Long =
        todayRepository.countUnfinishedTodayItems(userId, currentDate(userId))

    private fun currentDate(userId: UUID): LocalDate {
        val user = userRepository.findById(userId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
        }
        return LocalDate.now(ZoneId.of(user.timeZone))
    }
}
