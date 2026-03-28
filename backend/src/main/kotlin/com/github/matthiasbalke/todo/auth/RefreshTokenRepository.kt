package com.github.matthiasbalke.todo.auth

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface RefreshTokenRepository : JpaRepository<RefreshToken, UUID> {
    fun findByTokenHash(tokenHash: String): RefreshToken?
    fun deleteAllByUserId(userId: UUID)
}
