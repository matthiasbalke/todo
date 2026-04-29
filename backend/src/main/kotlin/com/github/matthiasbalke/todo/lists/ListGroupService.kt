package com.github.matthiasbalke.todo.lists

import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class ListGroupService(
    private val listGroupRepository: ListGroupRepository,
    private val listRepository: ListRepository,
    private val listGroupAssignmentRepository: ListGroupAssignmentRepository,
    private val listAccessService: ListAccessService,
) {

    fun getGroupsForUser(userId: UUID): kotlin.collections.List<ListGroup> =
        listGroupRepository.findAllByUserIdOrderBySortOrder(userId)

    @Transactional
    fun createGroup(userId: UUID, name: String): ListGroup {
        val maxOrder = listGroupRepository.maxSortOrderByUserId(userId)
        return listGroupRepository.save(
            ListGroup(userId = userId, name = name, sortOrder = maxOrder + 1)
        )
    }

    @Transactional
    fun renameGroup(groupId: UUID, userId: UUID, name: String): ListGroup {
        val group = requireOwnership(groupId, userId)
        group.name = name
        return listGroupRepository.save(group)
    }

    @Transactional
    fun deleteGroup(groupId: UUID, userId: UUID) {
        requireOwnership(groupId, userId)
        listGroupAssignmentRepository.deleteByGroupId(groupId)
        listGroupRepository.deleteById(groupId)
    }

    @Transactional
    fun reorderGroup(groupId: UUID, userId: UUID, newSortOrder: Int): ListGroup {
        val group = requireOwnership(groupId, userId)
        group.sortOrder = newSortOrder
        return listGroupRepository.save(group)
    }

    @Transactional
    fun assignListToGroup(listId: UUID, userId: UUID, groupId: UUID?): com.github.matthiasbalke.todo.lists.List {
        listAccessService.requireMembership(listId, userId)
        if (groupId != null) {
            val group = listGroupRepository.findById(groupId).orElseThrow {
                ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found")
            }
            if (group.userId != userId) {
                throw ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this group")
            }
        }
        val assignment = listGroupAssignmentRepository.findByListIdAndUserId(listId, userId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found")
        assignment.groupId = groupId
        listGroupAssignmentRepository.save(assignment)
        return listRepository.findById(listId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "List not found")
        }
    }

    @Transactional
    fun reorderListInGroup(listId: UUID, userId: UUID, newSortOrder: Int): com.github.matthiasbalke.todo.lists.List {
        listAccessService.requireMembership(listId, userId)
        val assignment = listGroupAssignmentRepository.findByListIdAndUserId(listId, userId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found")
        assignment.sortOrder = newSortOrder
        listGroupAssignmentRepository.save(assignment)
        return listRepository.findById(listId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "List not found")
        }
    }

    private fun requireOwnership(groupId: UUID, userId: UUID): ListGroup {
        val group = listGroupRepository.findById(groupId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found")
        }
        if (group.userId != userId) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this group")
        }
        return group
    }

    fun getListAssignmentForUser(listId: UUID, userId: UUID): ListGroupAssignment? =
        listGroupAssignmentRepository.findByListIdAndUserId(listId, userId)
}
