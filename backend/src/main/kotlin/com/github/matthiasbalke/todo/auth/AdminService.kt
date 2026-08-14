package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.items.ItemRepository
import com.github.matthiasbalke.todo.lists.ListRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class AdminService(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val webAuthnCredentialRepository: WebAuthnCredentialRepository,
    private val listRepository: ListRepository,
    private val itemRepository: ItemRepository,
) {

    fun requireAdmin(actorUserId: UUID): User {
        val actor = userRepository.findById(actorUserId).orElseThrow {
            ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")
        }
        if (actor.blockedAt != null) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Account is blocked")
        }
        if (!actor.admin) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Admin privileges required")
        }
        return actor
    }

    fun setupRequired(): Boolean = userRepository.countByAdminTrue() == 0L

    fun stats(actorUserId: UUID): AdminStats {
        requireAdmin(actorUserId)
        return AdminStats(
            users = userRepository.count(),
            admins = userRepository.countByAdminTrue(),
            blockedUsers = userRepository.countByBlockedAtIsNotNull(),
            lists = listRepository.count(),
            todoItems = itemRepository.count(),
        )
    }

    fun users(actorUserId: UUID): List<AdminUserDto> {
        requireAdmin(actorUserId)
        return userRepository.findAllOrderedByEmail().map { user ->
            AdminUserDto(
                id = user.id,
                email = user.email,
                displayName = user.displayName,
                admin = user.admin,
                blocked = user.blockedAt != null,
                blockedAt = user.blockedAt,
                passkeyCount = webAuthnCredentialRepository.countByUserId(user.id),
                createdAt = user.createdAt,
            )
        }
    }

    @Transactional
    fun updateUser(actorUserId: UUID, targetUserId: UUID, displayName: String, email: String): User {
        requireAdmin(actorUserId)
        if (displayName.isBlank()) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Display name cannot be blank")
        val target = userRepository.findById(targetUserId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
        }
        val trimmedEmail = email.trim()
        if (trimmedEmail.isBlank()) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Email cannot be blank")
        if (userRepository.existsByEmailAndIdNot(trimmedEmail, targetUserId)) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use")
        }
        target.displayName = displayName.trim()
        target.email = trimmedEmail
        return userRepository.save(target)
    }

    @Transactional
    fun setAdmin(actorUserId: UUID, targetUserId: UUID, admin: Boolean): User {
        requireAdmin(actorUserId)
        val target = userRepository.findById(targetUserId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
        }
        if (!admin && target.admin && target.blockedAt == null && userRepository.countByAdminTrueAndBlockedAtIsNull() <= 1L) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "At least one unblocked admin must remain")
        }
        target.admin = admin
        return userRepository.save(target)
    }

    @Transactional
    fun setBlocked(actorUserId: UUID, targetUserId: UUID, blocked: Boolean): User {
        requireAdmin(actorUserId)
        if (actorUserId == targetUserId && blocked) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "You cannot block yourself.")
        }
        val target = userRepository.findById(targetUserId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
        }
        if (blocked && target.admin && target.blockedAt == null && userRepository.countByAdminTrueAndBlockedAtIsNull() <= 1L) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "At least one unblocked admin must remain")
        }
        if (blocked) {
            target.blockedAt = Instant.now()
            target.blockedByUserId = actorUserId
            refreshTokenRepository.deleteAllByUserId(targetUserId)
        } else {
            target.blockedAt = null
            target.blockedByUserId = null
        }
        return userRepository.save(target)
    }

    data class AdminStats(
        val users: Long,
        val admins: Long,
        val blockedUsers: Long,
        val lists: Long,
        val todoItems: Long,
    )

    data class AdminUserDto(
        val id: UUID,
        val email: String,
        val displayName: String,
        val admin: Boolean,
        val blocked: Boolean,
        val blockedAt: Instant?,
        val passkeyCount: Long,
        val createdAt: Instant,
    )
}
