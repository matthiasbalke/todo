package com.github.matthiasbalke.todo.auth

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface WebAuthnCredentialRepository : JpaRepository<WebAuthnCredential, UUID> {
    @Query(value = "SELECT * FROM webauthn_credentials WHERE credential_id = :credentialId", nativeQuery = true)
    fun findByCredentialId(@Param("credentialId") credentialId: ByteArray): WebAuthnCredential?
    fun findAllByUserId(userId: UUID): List<WebAuthnCredential>
    fun deleteAllByUserId(userId: UUID)
}
