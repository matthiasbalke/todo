package com.github.matthiasbalke.todo.items

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ItemAssignmentRepository : JpaRepository<ItemAssignment, ItemAssignmentId> {
    fun findAllByIdItemId(itemId: UUID): List<ItemAssignment>
    fun deleteAllByIdItemId(itemId: UUID)
}
