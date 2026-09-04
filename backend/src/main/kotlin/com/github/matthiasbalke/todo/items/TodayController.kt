package com.github.matthiasbalke.todo.items

import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/today")
class TodayController(private val todayService: TodayService) {
    data class AssignedUserDto(val id: UUID, val displayName: String)
    data class RecurrenceRuleDto(val intervalUnit: String, val intervalValue: Int)
    data class TodayItemDto(
        val id: UUID,
        val listId: UUID,
        val categoryId: UUID?,
        val title: String,
        val notes: String?,
        val done: Boolean,
        val starred: Boolean,
        val dueDate: LocalDate?,
        val recurrenceRule: RecurrenceRuleDto?,
        val parentItemId: UUID?,
        val createdByUserId: UUID?,
        val updatedByUserId: UUID?,
        val assignedUsers: List<AssignedUserDto>,
        val sortOrder: Int,
        val createdAt: Instant,
        val updatedAt: Instant,
        val sourceListName: String,
        val sourceListEmoji: String?,
        val sourceListRole: String,
        val sourceListGroupOrder: Int?,
        val sourceListOrder: Int?,
        val sourceCategoryName: String?,
        val sourceCategoryColor: String?,
        val sourceCategoryOrder: Int?,
    )
    data class TodayCountDto(val count: Long)

    @GetMapping
    fun getToday(@AuthenticationPrincipal userId: UUID): List<TodayItemDto> =
        todayService.getItems(userId).map { it.toDto() }

    @GetMapping("/count")
    fun getCount(@AuthenticationPrincipal userId: UUID) =
        TodayCountDto(todayService.countUnfinished(userId))

    private fun TodayItem.toDto() = TodayItemDto(
        id = item.id,
        listId = item.listId,
        categoryId = item.categoryId,
        title = item.title,
        notes = item.notes,
        done = item.done,
        starred = item.starred,
        dueDate = item.dueDate,
        recurrenceRule = item.recurrenceRule?.let { RecurrenceRuleDto(it.intervalUnit.name, it.intervalValue) },
        parentItemId = item.parentItemId,
        createdByUserId = item.createdByUserId,
        updatedByUserId = item.updatedByUserId,
        assignedUsers = assignedUsers.map { AssignedUserDto(it.id, it.displayName) },
        sortOrder = item.sortOrder,
        createdAt = item.createdAt,
        updatedAt = item.updatedAt,
        sourceListName = sourceListName,
        sourceListEmoji = sourceListEmoji,
        sourceListRole = sourceListRole.name,
        sourceListGroupOrder = sourceListGroupOrder,
        sourceListOrder = sourceListOrder,
        sourceCategoryName = sourceCategoryName,
        sourceCategoryColor = sourceCategoryColor,
        sourceCategoryOrder = sourceCategoryOrder,
    )
}
