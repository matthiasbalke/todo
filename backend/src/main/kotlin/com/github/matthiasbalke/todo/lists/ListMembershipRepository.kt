package com.github.matthiasbalke.todo.lists

import com.github.matthiasbalke.todo.auth.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface ListMembershipRepository : JpaRepository<ListMembership, ListMembershipId> {

    fun findByListIdAndUserId(listId: UUID, userId: UUID): ListMembership?

    fun findAllByListId(listId: UUID): kotlin.collections.List<ListMembership>

    fun findAllByUserId(userId: UUID): kotlin.collections.List<ListMembership>

    fun countByListIdAndRole(listId: UUID, role: ListRole): Long

    @Query(
        """
        SELECT DISTINCT u
        FROM User u
        JOIN ListMembership sharedMembership ON sharedMembership.userId = u.id
        WHERE sharedMembership.listId IN (
            SELECT requesterMembership.listId
            FROM ListMembership requesterMembership
            WHERE requesterMembership.userId = :userId
        )
        AND u.id <> :userId
        AND NOT EXISTS (
            SELECT currentMembership
            FROM ListMembership currentMembership
            WHERE currentMembership.listId = :listId
            AND currentMembership.userId = u.id
        )
        """
    )
    fun findSuggestedUsersForList(
        @Param("listId") listId: UUID,
        @Param("userId") userId: UUID,
    ): kotlin.collections.List<User>
}
