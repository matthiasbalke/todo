package com.github.matthiasbalke.todo.push

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

interface PushSubscriptionRepository : JpaRepository<PushSubscription, UUID> {
    fun findAllByUserId(userId: UUID): List<PushSubscription>

    @Transactional
    fun deleteByUserIdAndEndpoint(userId: UUID, endpoint: String)

    fun existsByUserIdAndEndpoint(userId: UUID, endpoint: String): Boolean
}
