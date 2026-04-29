package com.github.matthiasbalke.todo.lists

import com.github.matthiasbalke.todo.auth.UserRepository
import com.github.matthiasbalke.todo.sse.ListEvent
import com.github.matthiasbalke.todo.sse.MemberPayload
import com.github.matthiasbalke.todo.sse.SsePublisher
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class ListService(
    private val listRepository: ListRepository,
    private val listMembershipRepository: ListMembershipRepository,
    private val listGroupAssignmentRepository: ListGroupAssignmentRepository,
    private val userRepository: UserRepository,
    private val listAccessService: ListAccessService,
    private val listGroupRepository: ListGroupRepository,
    private val ssePublisher: SsePublisher,
) {

    @Transactional
    fun createList(
        userId: UUID,
        name: String,
        emoji: String?,
        description: String?,
        sortField: String,
        sortDirection: String,
    ): List {
        val list = listRepository.save(
            List(
                name = name,
                emoji = emoji,
                description = description,
                defaultSortField = sortField,
                defaultSortDirection = sortDirection,
            )
        )
        listMembershipRepository.save(
            ListMembership(listId = list.id, userId = userId, role = ListRole.OWNER)
        )
        listGroupAssignmentRepository.save(
            ListGroupAssignment(listId = list.id, userId = userId)
        )
        return list
    }

    fun getListsForUser(userId: UUID): kotlin.collections.List<List> =
        listRepository.findAllByMemberUserId(userId)

    fun getListById(listId: UUID, userId: UUID): List {
        listAccessService.requireMembership(listId, userId)
        return listRepository.findById(listId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND)
        }
    }

    @Transactional
    fun updateList(
        listId: UUID,
        userId: UUID,
        name: String,
        emoji: String?,
        description: String?,
        sortField: String,
        sortDirection: String,
    ): List {
        listAccessService.requireMinRole(listId, userId, ListRole.OWNER)
        val list = listRepository.findById(listId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        list.name = name
        list.emoji = emoji
        list.description = description
        list.defaultSortField = sortField
        list.defaultSortDirection = sortDirection
        return listRepository.save(list)
    }

    @Transactional
    fun deleteList(listId: UUID, userId: UUID) {
        listAccessService.requireMinRole(listId, userId, ListRole.OWNER)
        listRepository.deleteById(listId)
    }

    fun getMembers(listId: UUID, userId: UUID): kotlin.collections.List<ListMembership> {
        listAccessService.requireMembership(listId, userId)
        return listMembershipRepository.findAllByListId(listId)
    }

    @Transactional
    fun addMember(listId: UUID, requestingUserId: UUID, email: String, role: ListRole): ListMembership {
        listAccessService.requireMinRole(listId, requestingUserId, ListRole.OWNER)
        val target = userRepository.findByEmail(email)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "No user found with email: $email")
        if (listMembershipRepository.findByListIdAndUserId(listId, target.id) != null) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "User is already a member of this list")
        }
        val membership = listMembershipRepository.save(
            ListMembership(listId = listId, userId = target.id, role = role)
        )
        listGroupAssignmentRepository.save(
            ListGroupAssignment(listId = listId, userId = target.id)
        )
        ssePublisher.publish(ListEvent.MemberAdded(listId, membership.toPayload()))
        return membership
    }

    @Transactional
    fun changeMemberRole(
        listId: UUID,
        requestingUserId: UUID,
        targetUserId: UUID,
        newRole: ListRole,
    ): ListMembership {
        listAccessService.requireMinRole(listId, requestingUserId, ListRole.OWNER)
        if (requestingUserId == targetUserId && newRole != ListRole.OWNER) {
            val ownerCount = listMembershipRepository.countByListIdAndRole(listId, ListRole.OWNER)
            if (ownerCount <= 1) {
                throw ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot demote yourself when you are the sole OWNER",
                )
            }
        }
        val membership = listMembershipRepository.findByListIdAndUserId(listId, targetUserId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Target user is not a member of this list")
        membership.role = newRole
        return listMembershipRepository.save(membership).also { ssePublisher.publish(ListEvent.MemberUpdated(listId, it.toPayload())) }
    }

    @Transactional
    fun removeMember(listId: UUID, requestingUserId: UUID, targetUserId: UUID) {
        listAccessService.requireMinRole(listId, requestingUserId, ListRole.OWNER)
        if (requestingUserId == targetUserId) {
            val ownerCount = listMembershipRepository.countByListIdAndRole(listId, ListRole.OWNER)
            if (ownerCount <= 1) {
                throw ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot remove yourself when you are the sole OWNER",
                )
            }
        }
        val membership = listMembershipRepository.findByListIdAndUserId(listId, targetUserId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Target user is not a member of this list")
        listMembershipRepository.delete(membership)
        ssePublisher.publish(ListEvent.MemberRemoved(listId, targetUserId))
    }

    private fun ListMembership.toPayload() = MemberPayload(
        userId = userId,
        listId = listId,
        role = role.name,
    )
}
