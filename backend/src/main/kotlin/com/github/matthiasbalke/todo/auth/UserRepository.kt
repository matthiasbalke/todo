package com.github.matthiasbalke.todo.auth

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface UserRepository : JpaRepository<User, UUID> {
    fun findByEmail(email: String): User?
    fun existsByEmailAndIdNot(email: String, id: UUID): Boolean
    fun countByAdminTrue(): Long
    fun countByBlockedAtIsNotNull(): Long
    fun countByAdminTrueAndBlockedAtIsNull(): Long

    @Query("SELECT u FROM User u ORDER BY lower(u.email)")
    fun findAllOrderedByEmail(): List<User>
}
