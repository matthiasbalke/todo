package com.github.matthiasbalke.todo.auth

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface WebAuthnCredentialRepository : JpaRepository<WebAuthnCredential, UUID> {
    fun findByCredentialId(credentialId: String): WebAuthnCredential?
    fun findAllByUserId(userId: UUID): List<WebAuthnCredential>
    fun findByIdAndUserId(id: UUID, userId: UUID): WebAuthnCredential?
    fun countByUserId(userId: UUID): Long
    fun deleteAllByUserId(userId: UUID)
}
