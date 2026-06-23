package com.github.matthiasbalke.todo.lists

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant
import java.util.UUID

interface ListRepository : JpaRepository<List, UUID> {

    @Query("SELECT l FROM List l JOIN ListMembership m ON m.listId = l.id WHERE m.userId = :userId")
    fun findAllByMemberUserId(userId: UUID): kotlin.collections.List<List>

    @Query("SELECT l.name FROM List l JOIN ListMembership m ON m.listId = l.id WHERE m.userId = :userId")
    fun findNamesByMemberUserId(@Param("userId") userId: UUID): kotlin.collections.List<String>

    fun countByCreatedAtAfter(since: Instant): Long
}
