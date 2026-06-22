package com.github.matthiasbalke.todo.lists

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
import java.util.UUID

@RestController
@RequestMapping("/api/list-groups")
class ListGroupController(
    private val listGroupService: ListGroupService,
) {

    // ─── DTOs ────────────────────────────────────────────────────────────────

    data class ListGroupDto(
        val id: UUID,
        val userId: UUID,
        val name: String,
        val sortOrder: Int,
        val createdAt: Instant,
    )

    data class CreateGroupRequest(val name: String)

    data class RenameGroupRequest(val name: String)

    data class ReorderGroupRequest(val sortOrder: Int)

    data class ReorderGroupsRequest(val groupIds: kotlin.collections.List<UUID>)

    // ─── Endpoints ───────────────────────────────────────────────────────────

    @GetMapping
    fun getGroups(@AuthenticationPrincipal userId: UUID): kotlin.collections.List<ListGroupDto> =
        listGroupService.getGroupsForUser(userId).map { it.toDto() }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createGroup(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody body: CreateGroupRequest,
    ): ListGroupDto = listGroupService.createGroup(userId, body.name).toDto()

    @PutMapping("/{gid}")
    fun renameGroup(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable gid: UUID,
        @RequestBody body: RenameGroupRequest,
    ): ListGroupDto = listGroupService.renameGroup(gid, userId, body.name).toDto()

    @DeleteMapping("/{gid}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteGroup(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable gid: UUID,
    ) = listGroupService.deleteGroup(gid, userId)

    @PatchMapping("/{gid}/order")
    fun reorderGroup(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable gid: UUID,
        @RequestBody body: ReorderGroupRequest,
    ): ListGroupDto = listGroupService.reorderGroup(gid, userId, body.sortOrder).toDto()

    @PostMapping("/reorder")
    fun reorderGroups(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody body: ReorderGroupsRequest,
    ): kotlin.collections.List<ListGroupDto> =
        listGroupService.reorderGroups(userId, body.groupIds).map { it.toDto() }

    // ─── Mapping helpers ─────────────────────────────────────────────────────

    private fun ListGroup.toDto() = ListGroupDto(
        id = id,
        userId = userId,
        name = name,
        sortOrder = sortOrder,
        createdAt = createdAt,
    )
}
