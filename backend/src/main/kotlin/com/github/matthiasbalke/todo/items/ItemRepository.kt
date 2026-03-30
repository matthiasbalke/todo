package com.github.matthiasbalke.todo.items

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ItemRepository : JpaRepository<TodoItem, UUID> {
    fun findAllByListId(listId: UUID): List<TodoItem>
    fun findByIdAndListId(id: UUID, listId: UUID): TodoItem?
}
