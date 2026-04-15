package com.github.matthiasbalke.todo.items

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate
import java.util.UUID

interface ItemRepository : JpaRepository<TodoItem, UUID> {
    fun findAllByListId(listId: UUID): List<TodoItem>
    fun findByIdAndListId(id: UUID, listId: UUID): TodoItem?
    fun findAllByListIdAndIdIn(listId: UUID, ids: Collection<UUID>): List<TodoItem>
    fun findByDueDateAndDoneFalse(dueDate: LocalDate): List<TodoItem>
    fun findByDueDateBeforeAndDoneFalse(dueDate: LocalDate): List<TodoItem>
}
