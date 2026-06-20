package com.github.matthiasbalke.todo.lists

import com.github.matthiasbalke.todo.auth.UserRepository
import com.github.matthiasbalke.todo.items.ItemAssignment
import com.github.matthiasbalke.todo.items.ItemAssignmentId
import com.github.matthiasbalke.todo.items.ItemAssignmentRepository
import com.github.matthiasbalke.todo.items.ItemRepository
import com.github.matthiasbalke.todo.items.TodoItem
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
    private val categoryRepository: CategoryRepository,
    private val itemRepository: ItemRepository,
    private val itemAssignmentRepository: ItemAssignmentRepository,
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

    fun getRole(listId: UUID, userId: UUID): ListRole =
        listAccessService.requireMembership(listId, userId).role

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

    @Transactional
    fun duplicateList(listId: UUID, userId: UUID): List {
        listAccessService.requireMinRole(listId, userId, ListRole.OWNER)
        val source = listRepository.findById(listId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        val duplicate = listRepository.save(
            List(
                name = nextDuplicateName(source.name, userId),
                emoji = source.emoji,
                description = source.description,
                defaultSortField = source.defaultSortField,
                defaultSortDirection = source.defaultSortDirection,
            )
        )

        copyMemberships(listId, duplicate.id)
        copyRequestingUserGroupAssignment(listId, duplicate.id, userId)

        val categoryIdMap = copyCategories(listId, duplicate.id)
        copyItems(listId, duplicate.id, categoryIdMap)

        return duplicate
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

    private fun nextDuplicateName(sourceName: String, userId: UUID): String {
        val baseName = sourceName.replace(Regex(""" \(\d+\)$"""), "")
        val existingNames = listRepository.findNamesByMemberUserId(userId).toSet()
        var counter = 1
        var candidate = "$baseName ($counter)"
        while (candidate in existingNames) {
            counter += 1
            candidate = "$baseName ($counter)"
        }
        return candidate
    }

    private fun copyMemberships(sourceListId: UUID, duplicateListId: UUID) {
        val memberships = listMembershipRepository.findAllByListId(sourceListId).map {
            ListMembership(listId = duplicateListId, userId = it.userId, role = it.role)
        }
        listMembershipRepository.saveAll(memberships)
    }

    private fun copyRequestingUserGroupAssignment(sourceListId: UUID, duplicateListId: UUID, userId: UUID) {
        val sourceAssignment = listGroupAssignmentRepository.findByListIdAndUserId(sourceListId, userId)
        listGroupAssignmentRepository.save(
            ListGroupAssignment(
                listId = duplicateListId,
                userId = userId,
                groupId = sourceAssignment?.groupId,
                sortOrder = sourceAssignment?.sortOrder ?: 0,
            )
        )
    }

    private fun copyCategories(sourceListId: UUID, duplicateListId: UUID): Map<UUID, UUID> =
        categoryRepository.findAllByListIdOrderBySortOrder(sourceListId)
            .associate { sourceCategory ->
                val duplicateCategory = categoryRepository.save(
                    Category(
                        listId = duplicateListId,
                        name = sourceCategory.name,
                        color = sourceCategory.color,
                        sortOrder = sourceCategory.sortOrder,
                    )
                )
                sourceCategory.id to duplicateCategory.id
            }

    private fun copyItems(sourceListId: UUID, duplicateListId: UUID, categoryIdMap: Map<UUID, UUID>) {
        val sourceItems = itemRepository.findAllByListId(sourceListId)
        if (sourceItems.isEmpty()) return

        val itemIdMap = mutableMapOf<UUID, UUID>()
        val duplicateItems = sourceItems.map { sourceItem ->
            TodoItem(
                listId = duplicateListId,
                categoryId = sourceItem.categoryId?.let { categoryIdMap[it] },
                title = sourceItem.title,
                notes = sourceItem.notes,
                done = sourceItem.done,
                starred = sourceItem.starred,
                dueDate = sourceItem.dueDate,
                recurrenceRule = sourceItem.recurrenceRule,
                parentItemId = null,
                createdByUserId = sourceItem.createdByUserId,
                sortOrder = sourceItem.sortOrder,
                createdAt = sourceItem.createdAt,
                updatedAt = sourceItem.updatedAt,
            ).also { duplicateItem ->
                itemIdMap[sourceItem.id] = duplicateItem.id
            }
        }
        itemRepository.saveAll(duplicateItems)

        duplicateItems.zip(sourceItems).forEach { (duplicateItem, sourceItem) ->
            duplicateItem.parentItemId = sourceItem.parentItemId?.let { itemIdMap[it] }
        }
        itemRepository.saveAll(duplicateItems)

        val assignments = itemAssignmentRepository.findAllByIdItemIdIn(sourceItems.map { it.id })
            .mapNotNull { sourceAssignment ->
                itemIdMap[sourceAssignment.id.itemId]?.let { duplicateItemId ->
                    ItemAssignment(ItemAssignmentId(duplicateItemId, sourceAssignment.id.userId))
                }
            }
        itemAssignmentRepository.saveAll(assignments)
    }
}
