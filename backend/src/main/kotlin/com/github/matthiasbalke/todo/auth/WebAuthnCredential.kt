package com.github.matthiasbalke.todo.auth

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "webauthn_credentials")
class WebAuthnCredential(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "credential_id", nullable = false, unique = true)
    val credentialId: ByteArray,

    @Column(name = "public_key", nullable = false)
    val publicKey: ByteArray,

    @Column(name = "sign_count", nullable = false)
    var signCount: Long = 0,

    @Column(name = "attestation_object", nullable = false)
    val attestationObject: ByteArray,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
)
