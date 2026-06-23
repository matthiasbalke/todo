package com.github.matthiasbalke.todo.items

import com.github.matthiasbalke.todo.metrics.AggregationResult

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.util.UUID

interface ItemRepository : JpaRepository<TodoItem, UUID> {
    fun findAllByListId(listId: UUID): kotlin.collections.List<TodoItem>
    fun findByIdAndListId(id: UUID, listId: UUID): TodoItem?
    fun findAllByListIdAndIdIn(listId: UUID, ids: Collection<UUID>): kotlin.collections.List<TodoItem>

    fun countByDone(done: Boolean): Long

    fun countByCreatedAtAfter(since: Instant): Long

    @Query("SELECT COALESCE(MIN(cnt), 0) AS min, COALESCE(MAX(cnt), 0) AS max, COALESCE(AVG(cnt), 0) AS avg FROM (SELECT COUNT(*) AS cnt FROM TodoItem GROUP BY listId)")
    fun getItemsPerListStats(): AggregationResult
}
