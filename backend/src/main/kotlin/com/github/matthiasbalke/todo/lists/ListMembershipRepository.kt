package com.github.matthiasbalke.todo.lists

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ListMembershipRepository : JpaRepository<ListMembership, ListMembershipId> {

    fun findByListIdAndUserId(listId: UUID, userId: UUID): ListMembership?

    fun findAllByListId(listId: UUID): kotlin.collections.List<ListMembership>

    fun countByListIdAndRole(listId: UUID, role: ListRole): Long
}
