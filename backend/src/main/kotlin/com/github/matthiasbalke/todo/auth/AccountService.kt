package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.lists.List
import com.github.matthiasbalke.todo.lists.ListMembershipRepository
import com.github.matthiasbalke.todo.lists.ListRepository
import com.github.matthiasbalke.todo.lists.ListRole
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class AccountService(
    private val userRepository: UserRepository,
    private val webAuthnCredentialRepository: WebAuthnCredentialRepository,
    private val listRepository: ListRepository,
    private val listMembershipRepository: ListMembershipRepository,
) {

    @Transactional
    fun updateProfile(userId: UUID, displayName: String, email: String): User {
        if (displayName.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Display name cannot be blank")
        }
        val user = userRepository.findById(userId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND)
        }
        val trimmedEmail = email.trim()
        if (trimmedEmail != user.email && userRepository.existsByEmailAndIdNot(trimmedEmail, userId)) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use")
        }
        user.displayName = displayName.trim()
        user.email = trimmedEmail
        return userRepository.save(user)
    }

    fun getPasskeys(userId: UUID): kotlin.collections.List<WebAuthnCredential> =
        webAuthnCredentialRepository.findAllByUserId(userId)

    @Transactional
    fun savePasskeyLabel(credentialId: String, label: String?): WebAuthnCredential {
        val credential = webAuthnCredentialRepository.findByCredentialId(credentialId)
            ?: throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Credential not found after registration")
        if (label != null) {
            credential.label = label
            webAuthnCredentialRepository.save(credential)
        }
        return credential
    }

    @Transactional
    fun removePasskey(userId: UUID, passkeyId: UUID) {
        val credential = webAuthnCredentialRepository.findByIdAndUserId(passkeyId, userId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Passkey not found")
        if (webAuthnCredentialRepository.countByUserId(userId) <= 1L) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Cannot remove the last passkey")
        }
        webAuthnCredentialRepository.delete(credential)
    }

    fun getDeletionPreview(userId: UUID): DeletionPreview {
        val memberships = listMembershipRepository.findAllByUserId(userId)
        val listsToDelete = mutableListOf<List>()
        val listsToLeave = mutableListOf<List>()
        for (membership in memberships) {
            val list = listRepository.findById(membership.listId).orElse(null) ?: continue
            if (membership.role == ListRole.OWNER &&
                listMembershipRepository.countByListIdAndRole(membership.listId, ListRole.OWNER) <= 1L) {
                listsToDelete.add(list)
            } else {
                listsToLeave.add(list)
            }
        }
        return DeletionPreview(listsToDelete, listsToLeave)
    }

    @Transactional
    fun deleteAccount(userId: UUID) {
        val memberships = listMembershipRepository.findAllByUserId(userId)
        for (membership in memberships) {
            if (membership.role == ListRole.OWNER &&
                listMembershipRepository.countByListIdAndRole(membership.listId, ListRole.OWNER) <= 1L) {
                listRepository.deleteById(membership.listId)
            }
        }
        userRepository.deleteById(userId)
    }

    data class DeletionPreview(
        val listsToDelete: kotlin.collections.List<List>,
        val listsToLeave: kotlin.collections.List<List>,
    )
}
