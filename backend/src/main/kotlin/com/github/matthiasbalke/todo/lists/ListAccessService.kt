package com.github.matthiasbalke.todo.lists

import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class ListAccessService(private val listMembershipRepository: ListMembershipRepository) {

    fun requireMembership(listId: UUID, userId: UUID): ListMembership =
        listMembershipRepository.findByListIdAndUserId(listId, userId)
            ?: throw ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this list")

    fun requireMinRole(listId: UUID, userId: UUID, minimum: ListRole) {
        val membership = requireMembership(listId, userId)
        if (membership.role.ordinal > minimum.ordinal) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Requires ${minimum.name} role or higher")
        }
    }
}
