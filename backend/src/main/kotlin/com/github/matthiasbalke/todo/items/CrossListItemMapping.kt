package com.github.matthiasbalke.todo.items

import com.github.matthiasbalke.todo.items.TodayController.AssignedUserDto
import com.github.matthiasbalke.todo.items.TodayController.RecurrenceRuleDto
import com.github.matthiasbalke.todo.items.TodayController.TodayItemDto

fun TodayItem.toCrossListDto() = TodayItemDto(
    id = item.id,
    listId = item.listId,
    categoryId = item.categoryId,
    title = item.title,
    notes = item.notes,
    done = item.done,
    starred = item.starred,
    dueDate = item.dueDate,
    recurrenceRule = item.recurrenceRule?.let { RecurrenceRuleDto(it.intervalUnit.name, it.intervalValue, it.weekdays?.map { day -> day.name }) },
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
