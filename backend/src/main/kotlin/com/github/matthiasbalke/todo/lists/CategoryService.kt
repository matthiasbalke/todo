package com.github.matthiasbalke.todo.lists

import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class CategoryService(
    private val categoryRepository: CategoryRepository,
    private val listAccessService: ListAccessService,
) {

    fun getCategories(listId: UUID, userId: UUID): kotlin.collections.List<Category> {
        listAccessService.requireMembership(listId, userId)
        return categoryRepository.findAllByListIdOrderBySortOrder(listId)
    }

    @Transactional
    fun createCategory(listId: UUID, userId: UUID, name: String, color: String?, sortOrder: Int): Category {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        return categoryRepository.save(Category(listId = listId, name = name, color = color, sortOrder = sortOrder))
    }

    @Transactional
    fun updateCategory(listId: UUID, categoryId: UUID, userId: UUID, name: String, color: String?, sortOrder: Int): Category {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        val category = categoryRepository.findByIdAndListId(categoryId, listId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found")
        category.name = name
        category.color = color
        category.sortOrder = sortOrder
        return categoryRepository.save(category)
    }

    @Transactional
    fun deleteCategory(listId: UUID, categoryId: UUID, userId: UUID) {
        listAccessService.requireMinRole(listId, userId, ListRole.EDITOR)
        categoryRepository.findByIdAndListId(categoryId, listId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found")
        categoryRepository.deleteById(categoryId)
    }
}
