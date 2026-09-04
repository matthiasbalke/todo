package com.github.matthiasbalke.todo.sse

import java.time.Instant
import java.time.LocalDate
import java.util.UUID

sealed class ListEvent {
    abstract val listId: UUID

    data class ItemCreated(override val listId: UUID, val item: ItemPayload) : ListEvent()
    data class ItemUpdated(override val listId: UUID, val item: ItemPayload) : ListEvent()
    data class ItemDeleted(override val listId: UUID, val itemId: UUID) : ListEvent()
    data class CategoryCreated(override val listId: UUID, val category: CategoryPayload) : ListEvent()
    data class CategoryUpdated(override val listId: UUID, val category: CategoryPayload) : ListEvent()
    data class CategoryDeleted(override val listId: UUID, val categoryId: UUID) : ListEvent()
    data class MemberAdded(override val listId: UUID, val member: MemberPayload) : ListEvent()
    data class MemberUpdated(override val listId: UUID, val member: MemberPayload) : ListEvent()
    data class MemberRemoved(override val listId: UUID, val userId: UUID) : ListEvent()

    fun eventType(): String = when (this) {
        is ItemCreated -> "item.created"
        is ItemUpdated -> "item.updated"
        is ItemDeleted -> "item.deleted"
        is CategoryCreated -> "category.created"
        is CategoryUpdated -> "category.updated"
        is CategoryDeleted -> "category.deleted"
        is MemberAdded -> "member.added"
        is MemberUpdated -> "member.updated"
        is MemberRemoved -> "member.removed"
    }

    fun payload(): Any = when (this) {
        is ItemCreated -> item
        is ItemUpdated -> item
        is ItemDeleted -> mapOf("itemId" to itemId)
        is CategoryCreated -> category
        is CategoryUpdated -> category
        is CategoryDeleted -> mapOf("categoryId" to categoryId)
        is MemberAdded -> member
        is MemberUpdated -> member
        is MemberRemoved -> mapOf("userId" to userId)
    }
}

data class ItemPayload(
    val id: UUID,
    val listId: UUID,
    val categoryId: UUID?,
    val title: String,
    val notes: String?,
    val done: Boolean,
    val starred: Boolean,
    val dueDate: LocalDate?,
    val recurrenceRule: RecurrenceRulePayload?,
    val parentItemId: UUID?,
    val createdByUserId: UUID?,
    val updatedByUserId: UUID?,
    val assignedUserIds: List<UUID>,
    val sortOrder: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class RecurrenceRulePayload(val intervalUnit: String, val intervalValue: Int)

data class CategoryPayload(
    val id: UUID,
    val listId: UUID,
    val name: String,
    val color: String?,
    val sortOrder: Int,
    val createdAt: Instant,
)

data class MemberPayload(
    val userId: UUID,
    val listId: UUID,
    val role: String,
)
