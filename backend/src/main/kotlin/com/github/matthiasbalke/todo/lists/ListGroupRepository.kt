package com.github.matthiasbalke.todo.lists

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface ListGroupRepository : JpaRepository<ListGroup, UUID> {
    fun findAllByUserIdOrderBySortOrder(userId: UUID): kotlin.collections.List<ListGroup>

    @Query("SELECT COALESCE(MAX(g.sortOrder), -1) FROM ListGroup g WHERE g.userId = :userId")
    fun maxSortOrderByUserId(@Param("userId") userId: UUID): Int
}
