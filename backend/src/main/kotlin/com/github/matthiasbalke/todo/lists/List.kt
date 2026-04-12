package com.github.matthiasbalke.todo.lists

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "lists")
class List(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(nullable = false)
    var name: String,

    @Column
    var emoji: String? = null,

    @Column
    var description: String? = null,

    @Column(name = "default_sort_field", nullable = false)
    var defaultSortField: String = "CREATED",

    @Column(name = "default_sort_direction", nullable = false)
    var defaultSortDirection: String = "ASC",

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
)
