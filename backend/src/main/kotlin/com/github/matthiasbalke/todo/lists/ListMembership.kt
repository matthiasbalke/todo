package com.github.matthiasbalke.todo.lists

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.IdClass
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "list_memberships")
@IdClass(ListMembershipId::class)
class ListMembership(
    @Id
    @Column(name = "list_id")
    val listId: UUID,

    @Id
    @Column(name = "user_id")
    val userId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var role: ListRole,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
)
