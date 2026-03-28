package com.github.matthiasbalke.todo.auth

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "revoked_tokens")
class RevokedToken(
    @Id
    val jti: String,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: Instant,

    @Column(name = "revoked_at", nullable = false, updatable = false)
    val revokedAt: Instant = Instant.now(),
)
