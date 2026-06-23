package com.github.matthiasbalke.todo.push

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "push_subscriptions")
class PushSubscription(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(nullable = false, columnDefinition = "TEXT")
    val endpoint: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val p256dh: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val auth: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
)
