package com.github.matthiasbalke.todo.auth

import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

interface RevokedTokenRepository : JpaRepository<RevokedToken, String> {
    fun existsByJti(jti: String): Boolean
    fun deleteByExpiresAtBefore(cutoff: Instant)
}
