package com.github.matthiasbalke.todo.lists

import com.github.matthiasbalke.todo.metrics.AggregationResult

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.util.UUID

interface ListMembershipRepository : JpaRepository<ListMembership, ListMembershipId> {

    fun findByListIdAndUserId(listId: UUID, userId: UUID): ListMembership?

    fun findAllByListId(listId: UUID): kotlin.collections.List<ListMembership>

    fun findAllByUserId(userId: UUID): kotlin.collections.List<ListMembership>

    fun countByListIdAndRole(listId: UUID, role: ListRole): Long

    fun countByCreatedAtAfter(since: Instant): Long

    @Query("SELECT COALESCE(MIN(cnt), 0) AS min, COALESCE(MAX(cnt), 0) AS max, COALESCE(AVG(cnt), 0) AS avg FROM (SELECT COUNT(*) AS cnt FROM ListMembership GROUP BY userId)")
    fun getListsPerUserStats(): AggregationResult

    @Query("SELECT COALESCE(MIN(cnt), 0) AS min, COALESCE(MAX(cnt), 0) AS max, COALESCE(AVG(cnt), 0) AS avg FROM (SELECT COUNT(*) AS cnt FROM ListMembership GROUP BY listId)")
    fun getUsersPerListStats(): AggregationResult
}
