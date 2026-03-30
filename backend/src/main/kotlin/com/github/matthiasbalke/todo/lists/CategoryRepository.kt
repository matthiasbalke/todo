package com.github.matthiasbalke.todo.lists

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface CategoryRepository : JpaRepository<Category, UUID> {

    fun findAllByListIdOrderBySortOrder(listId: UUID): kotlin.collections.List<Category>

    fun findByIdAndListId(id: UUID, listId: UUID): Category?
}
