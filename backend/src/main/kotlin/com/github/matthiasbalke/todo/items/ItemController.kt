package com.github.matthiasbalke.todo.items

import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/lists/{id}/items")
class ItemController(private val itemService: ItemService) {

    // ─── DTOs ────────────────────────────────────────────────────────────────

    data class RecurrenceRuleDto(val intervalUnit: String, val intervalValue: Int)

    data class ItemDto(
        val id: UUID,
        val listId: UUID,
        val categoryId: UUID?,
        val title: String,
        val notes: String?,
        val done: Boolean,
        val starred: Boolean,
        val dueDate: LocalDate?,
        val recurrenceRule: RecurrenceRuleDto?,
        val parentItemId: UUID?,
        val createdByUserId: UUID?,
        val assignedUserIds: List<UUID>,
        val sortOrder: Int,
        val createdAt: Instant,
        val updatedAt: Instant,
    )

    data class CreateItemRequest(
        val title: String,
        val notes: String? = null,
        val categoryId: UUID? = null,
        val dueDate: LocalDate? = null,
        val starred: Boolean = false,
        val recurrenceRule: RecurrenceRuleDto? = null,
        val assignedUserIds: List<UUID> = emptyList(),
        val sortOrder: Int = 0,
    )

    data class UpdateItemRequest(
        val title: String,
        val notes: String? = null,
        val categoryId: UUID? = null,
        val dueDate: LocalDate? = null,
        val starred: Boolean = false,
        val recurrenceRule: RecurrenceRuleDto? = null,
        val assignedUserIds: List<UUID> = emptyList(),
        val sortOrder: Int = 0,
    )

    data class UpdateOrderRequest(val sortOrder: Int)

    data class ReorderEntry(val id: UUID, val sortOrder: Int)
    data class ReorderRequest(val items: List<ReorderEntry>)

    // ─── Endpoints ───────────────────────────────────────────────────────────

    @GetMapping
    fun getItems(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
    ): List<ItemDto> = itemService.getItems(id, userId).map { it.toDto() }

    @GetMapping("/{iid}")
    fun getItem(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @PathVariable iid: UUID,
    ): ItemDto = itemService.getItem(id, iid, userId).toDto()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createItem(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @RequestBody body: CreateItemRequest,
    ): ItemDto = itemService.createItem(id, userId, body.toServiceRequest()).toDto()

    @PutMapping("/{iid}")
    fun updateItem(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @PathVariable iid: UUID,
        @RequestBody body: UpdateItemRequest,
    ): ItemDto = itemService.updateItem(id, iid, userId, body.toServiceRequest()).toDto()

    @DeleteMapping("/{iid}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteItem(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @PathVariable iid: UUID,
    ) = itemService.deleteItem(id, iid, userId)

    @PatchMapping("/{iid}/done")
    fun toggleDone(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @PathVariable iid: UUID,
    ): ItemDto = itemService.toggleDone(id, iid, userId).toDto()

    @PatchMapping("/{iid}/starred")
    fun toggleStarred(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @PathVariable iid: UUID,
    ): ItemDto = itemService.toggleStarred(id, iid, userId).toDto()

    @PostMapping("/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun reorderItems(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @RequestBody body: ReorderRequest,
    ) = itemService.reorderItems(id, userId, body.items.map { it.id to it.sortOrder })

    @PatchMapping("/{iid}/order")
    fun updateOrder(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @PathVariable iid: UUID,
        @RequestBody body: UpdateOrderRequest,
    ): ItemDto = itemService.updateOrder(id, iid, userId, body.sortOrder).toDto()

    // ─── Mapping helpers ─────────────────────────────────────────────────────

    private fun ItemWithAssignees.toDto() = ItemDto(
        id = item.id,
        listId = item.listId,
        categoryId = item.categoryId,
        title = item.title,
        notes = item.notes,
        done = item.done,
        starred = item.starred,
        dueDate = item.dueDate,
        recurrenceRule = item.recurrenceRule?.let { RecurrenceRuleDto(it.intervalUnit.name, it.intervalValue) },
        parentItemId = item.parentItemId,
        createdByUserId = item.createdByUserId,
        assignedUserIds = assignedUserIds,
        sortOrder = item.sortOrder,
        createdAt = item.createdAt,
        updatedAt = item.updatedAt,
    )

    private fun RecurrenceRuleDto.toDomain() = RecurrenceRule(
        intervalUnit = IntervalUnit.valueOf(intervalUnit),
        intervalValue = intervalValue,
    )

    private fun CreateItemRequest.toServiceRequest() = com.github.matthiasbalke.todo.items.CreateItemRequest(
        title = title,
        notes = notes,
        categoryId = categoryId,
        dueDate = dueDate,
        starred = starred,
        recurrenceRule = recurrenceRule?.toDomain(),
        assignedUserIds = assignedUserIds,
        sortOrder = sortOrder,
    )

    private fun UpdateItemRequest.toServiceRequest() = com.github.matthiasbalke.todo.items.UpdateItemRequest(
        title = title,
        notes = notes,
        categoryId = categoryId,
        dueDate = dueDate,
        starred = starred,
        recurrenceRule = recurrenceRule?.toDomain(),
        assignedUserIds = assignedUserIds,
        sortOrder = sortOrder,
    )
}
