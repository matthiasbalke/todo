package com.github.matthiasbalke.todo.lists

import com.github.matthiasbalke.todo.auth.UserRepository
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
@RequestMapping("/api/lists")
class ListController(
    private val listService: ListService,
    private val listGroupService: ListGroupService,
    private val userRepository: UserRepository,
) {

    // ─── DTOs ────────────────────────────────────────────────────────────────

    data class ListDto(
        val id: UUID,
        val name: String,
        val emoji: String?,
        val description: String?,
        val defaultSortField: String,
        val defaultSortDirection: String,
        val createdAt: Instant,
        val role: ListRole,
    )

    data class ListSummaryDto(
        val id: UUID,
        val name: String,
        val emoji: String?,
        val createdAt: Instant,
        val groupId: UUID?,
        val sortOrderInGroup: Int,
        val role: ListRole,
    )

    data class AssignGroupRequest(val groupId: UUID?)

    data class ReorderInGroupRequest(val sortOrder: Int)

    data class CreateListRequest(
        val name: String,
        val emoji: String? = null,
        val description: String? = null,
        val defaultSortField: String = "CREATED",
        val defaultSortDirection: String = "ASC",
    )

    data class UpdateListRequest(
        val name: String,
        val emoji: String? = null,
        val description: String? = null,
        val defaultSortField: String = "CREATED",
        val defaultSortDirection: String = "ASC",
    )

    data class MemberDto(
        val userId: UUID,
        val email: String,
        val displayName: String,
        val role: ListRole,
        val createdAt: Instant,
    )

    data class InviteMemberRequest(
        val email: String,
        val role: ListRole = ListRole.VIEWER,
    )

    data class ChangeRoleRequest(
        val role: ListRole,
    )

    // ─── List CRUD ───────────────────────────────────────────────────────────

    @GetMapping
    fun getLists(@AuthenticationPrincipal userId: UUID): kotlin.collections.List<ListSummaryDto> =
        listService.getListsForUser(userId).map { it.toSummaryDto(userId, listGroupService) }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createList(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody body: CreateListRequest,
    ): ListDto =
        listService.createList(
            userId = userId,
            name = body.name,
            emoji = body.emoji,
            description = body.description,
            sortField = body.defaultSortField,
            sortDirection = body.defaultSortDirection,
        ).toDto(ListRole.OWNER)

    @GetMapping("/{id}")
    fun getList(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
    ): ListDto = listService.getListById(id, userId).toDto(listService.getRole(id, userId))

    @PutMapping("/{id}")
    fun updateList(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @RequestBody body: UpdateListRequest,
    ): ListDto =
        listService.updateList(
            listId = id,
            userId = userId,
            name = body.name,
            emoji = body.emoji,
            description = body.description,
            sortField = body.defaultSortField,
            sortDirection = body.defaultSortDirection,
        ).toDto(listService.getRole(id, userId))

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteList(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
    ) = listService.deleteList(id, userId)

    @PatchMapping("/{id}/group")
    fun assignGroup(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @RequestBody body: AssignGroupRequest,
    ): ListSummaryDto = listGroupService.assignListToGroup(id, userId, body.groupId).toSummaryDto(userId, listGroupService)

    @PatchMapping("/{id}/group-order")
    fun reorderInGroup(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @RequestBody body: ReorderInGroupRequest,
    ): ListSummaryDto = listGroupService.reorderListInGroup(id, userId, body.sortOrder).toSummaryDto(userId, listGroupService)

    // ─── Member management ───────────────────────────────────────────────────

    @GetMapping("/{id}/members")
    fun getMembers(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
    ): kotlin.collections.List<MemberDto> =
        listService.getMembers(id, userId).map { it.toMemberDto() }

    @PostMapping("/{id}/members")
    @ResponseStatus(HttpStatus.CREATED)
    fun addMember(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @RequestBody body: InviteMemberRequest,
    ): MemberDto = listService.addMember(id, userId, body.email, body.role).toMemberDto()

    @PutMapping("/{id}/members/{uid}")
    fun changeMemberRole(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @PathVariable uid: UUID,
        @RequestBody body: ChangeRoleRequest,
    ): MemberDto = listService.changeMemberRole(id, userId, uid, body.role).toMemberDto()

    @DeleteMapping("/{id}/members/{uid}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun removeMember(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable id: UUID,
        @PathVariable uid: UUID,
    ) = listService.removeMember(id, userId, uid)

    // ─── Mapping helpers ─────────────────────────────────────────────────────

    private fun List.toDto(role: ListRole) = ListDto(
        id = id,
        name = name,
        emoji = emoji,
        description = description,
        defaultSortField = defaultSortField,
        defaultSortDirection = defaultSortDirection,
        createdAt = createdAt,
        role = role,
    )

    private fun List.toSummaryDto(userId: UUID, listGroupService: ListGroupService) : ListSummaryDto {
        val assignment = listGroupService.getListAssignmentForUser(id, userId)
        return ListSummaryDto(
            id = id,
            name = name,
            emoji = emoji,
            createdAt = createdAt,
            groupId = assignment?.groupId,
            sortOrderInGroup = assignment?.sortOrder ?: 0,
            role = listService.getRole(id, userId),
        )
    }

    private fun ListMembership.toMemberDto(): MemberDto {
        val user = userRepository.findById(userId).orElseThrow()
        return MemberDto(
            userId = userId,
            email = user.email,
            displayName = user.displayName,
            role = role,
            createdAt = createdAt,
        )
    }
}
