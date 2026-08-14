package com.github.matthiasbalke.todo.auth

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface PasskeyRecoveryTokenRepository : JpaRepository<PasskeyRecoveryToken, UUID> {
    fun findByTokenHash(tokenHash: String): PasskeyRecoveryToken?
}
