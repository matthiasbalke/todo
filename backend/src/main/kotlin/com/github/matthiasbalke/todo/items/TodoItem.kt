package com.github.matthiasbalke.todo.items

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "todo_items")
class TodoItem(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "list_id", nullable = false)
    val listId: UUID,

    @Column(name = "category_id")
    var categoryId: UUID? = null,

    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(nullable = false)
    var done: Boolean = false,

    @Column(nullable = false)
    var starred: Boolean = false,

    @Column(name = "due_date")
    var dueDate: LocalDate? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recurrence_rule", columnDefinition = "JSONB")
    var recurrenceRule: RecurrenceRule? = null,

    @Column(name = "parent_item_id")
    var parentItemId: UUID? = null,

    @Column(name = "created_by_user_id")
    val createdByUserId: UUID? = null,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
