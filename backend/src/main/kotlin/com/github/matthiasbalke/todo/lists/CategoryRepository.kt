package com.github.matthiasbalke.todo.lists

import com.github.matthiasbalke.todo.metrics.AggregationResult
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.util.UUID

interface CategoryRepository : JpaRepository<Category, UUID> {

    fun findAllByListIdOrderBySortOrder(listId: UUID): kotlin.collections.List<Category>

    fun findByIdAndListId(id: UUID, listId: UUID): Category?

    fun countByCreatedAtAfter(since: Instant): Long

    @Query("SELECT COALESCE(MIN(cnt), 0) AS min, COALESCE(MAX(cnt), 0) AS max, COALESCE(AVG(cnt), 0) AS avg FROM (SELECT COUNT(*) AS cnt FROM Category GROUP BY listId)")
    fun getCategoriesPerListStats(): AggregationResult
}
