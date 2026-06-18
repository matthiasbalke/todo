package com.github.matthiasbalke.todo.auth

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "users")
class User(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(nullable = false, unique = true)
    var email: String,

    @Column(name = "display_name", nullable = false)
    var displayName: String,

    @Column(name = "time_zone", nullable = false)
    var timeZone: String = "UTC",

    @Column(name = "time_zone_initialized", nullable = false)
    var timeZoneInitialized: Boolean = false,

    @Column(name = "today_view_enabled", nullable = false)
    var todayViewEnabled: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
)
