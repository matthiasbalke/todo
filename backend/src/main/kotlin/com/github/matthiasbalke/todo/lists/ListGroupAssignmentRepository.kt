package com.github.matthiasbalke.todo.lists

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ListGroupAssignmentRepository : JpaRepository<ListGroupAssignment, UUID> {
    fun findByListIdAndUserId(listId: UUID, userId: UUID): ListGroupAssignment?
    fun findAllByUserId(userId: UUID): kotlin.collections.List<ListGroupAssignment>
    fun deleteByGroupId(groupId: UUID)
}
