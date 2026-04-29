package com.github.matthiasbalke.todo.lists

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "list_group_assignments")
class ListGroupAssignment(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "list_id", nullable = false)
    val listId: UUID,

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "group_id")
    var groupId: UUID? = null,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
)
