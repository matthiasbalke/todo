package com.github.matthiasbalke.todo.items

import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/agile")
class AgileController(private val service: AgileService) {
    data class SelectionRequest(val selected: Boolean)
    data class OrderRequest(val itemIds: List<UUID>)
    data class Count(val count: Long)
    data class SelectionResult(val selected: Boolean, val count: Long)

    @GetMapping
    fun entries(@AuthenticationPrincipal userId: UUID) =
        service.getItems(userId).map { it.toCrossListDto() }

    @GetMapping("/count")
    fun count(@AuthenticationPrincipal userId: UUID) = Count(service.count(userId))

    @PutMapping("/items/{itemId}")
    fun select(@AuthenticationPrincipal userId: UUID, @PathVariable itemId: UUID, @RequestBody body: SelectionRequest) =
        SelectionResult(body.selected, service.select(userId, itemId, body.selected))

    @PutMapping("/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun reorder(@AuthenticationPrincipal userId: UUID, @RequestBody body: OrderRequest) {
        service.reorder(userId, body.itemIds)
    }
}
