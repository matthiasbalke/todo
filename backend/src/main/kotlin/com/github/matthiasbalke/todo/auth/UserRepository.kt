package com.github.matthiasbalke.todo.auth

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface UserRepository : JpaRepository<User, UUID> {
    fun findByEmail(email: String): User?
    fun existsByEmailAndIdNot(email: String, id: UUID): Boolean
}
