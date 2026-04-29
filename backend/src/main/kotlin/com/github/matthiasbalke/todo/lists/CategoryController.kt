package com.github.matthiasbalke.todo.lists

import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/api/lists/{id}/categories")
class CategoryController(private val categoryService: CategoryService) {

    // ─── DTOs ────────────────────────────────────────────────────────────────

    data class CategoryDto(
        val id: UUID,
        val listId: UUID,
        val name: String,
        val color: String?,
        val sortOrder: Int,
        val createdAt: Instant,
    )

    data class CreateCategoryRequest(
        val name: String,
        val color: String? = null,
        val sortOrder: Int = 0,
    )

    data class UpdateCategoryRequest(
        val name: String,
        val color: String? = null,
        val sortOrder: Int,
    )

    // ─── Endpoints ───────────────────────────────────────────────────────────

    @GetMapping
    fun getCategories(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
    ): kotlin.collections.List<CategoryDto> =
        categoryService.getCategories(id, userId).map { cat -> cat.toDto() }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createCategory(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @RequestBody body: CreateCategoryRequest,
    ): CategoryDto =
        categoryService.createCategory(id, userId, body.name, body.color, body.sortOrder).toDto()

    @PutMapping("/{cid}")
    fun updateCategory(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @PathVariable cid: UUID,
        @RequestBody body: UpdateCategoryRequest,
    ): CategoryDto =
        categoryService.updateCategory(id, cid, userId, body.name, body.color, body.sortOrder).toDto()

    @DeleteMapping("/{cid}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteCategory(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @PathVariable cid: UUID,
    ) = categoryService.deleteCategory(id, cid, userId)

    // ─── Mapping helpers ─────────────────────────────────────────────────────

    private fun Category.toDto() = CategoryDto(
        id = id,
        listId = listId,
        name = name,
        color = color,
        sortOrder = sortOrder,
        createdAt = createdAt,
    )
}
