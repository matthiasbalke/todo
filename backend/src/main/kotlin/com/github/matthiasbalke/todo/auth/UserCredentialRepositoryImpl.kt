package com.github.matthiasbalke.todo.auth

import org.springframework.security.web.webauthn.api.Bytes
import org.springframework.security.web.webauthn.api.CredentialRecord
import org.springframework.security.web.webauthn.api.ImmutableCredentialRecord
import org.springframework.security.web.webauthn.api.PublicKeyCose
import org.springframework.security.web.webauthn.management.UserCredentialRepository
import org.springframework.stereotype.Component
import java.nio.ByteBuffer
import java.util.UUID

@Component
class UserCredentialRepositoryImpl(
    private val credentialRepository: WebAuthnCredentialRepository,
    private val userRepository: UserRepository,
) : UserCredentialRepository {

    override fun save(credentialRecord: CredentialRecord) {
        val existing = credentialRepository.findByCredentialId(credentialRecord.credentialId.bytes)
        if (existing != null) {
            existing.signCount = credentialRecord.signatureCount
            credentialRepository.save(existing)
        } else {
            val userId = bytesToUuid(credentialRecord.userEntityUserId.bytes)
                ?: error("Invalid user handle in credential record")
            credentialRepository.save(
                WebAuthnCredential(
                    userId = userId,
                    credentialId = credentialRecord.credentialId.bytes,
                    publicKey = credentialRecord.publicKey.bytes,
                    signCount = credentialRecord.signatureCount,
                )
            )
        }
    }

    override fun findByCredentialId(credentialId: Bytes): CredentialRecord? {
        val credential = credentialRepository.findByCredentialId(credentialId.bytes) ?: return null
        return credential.toCredentialRecord()
    }

    override fun findByUserId(userId: Bytes): List<CredentialRecord> {
        val uuid = bytesToUuid(userId.bytes) ?: return emptyList()
        return credentialRepository.findAllByUserId(uuid).map { it.toCredentialRecord() }
    }

    override fun delete(credentialId: Bytes) {
        val credential = credentialRepository.findByCredentialId(credentialId.bytes) ?: return
        credentialRepository.delete(credential)
    }

    private fun WebAuthnCredential.toCredentialRecord(): CredentialRecord =
        ImmutableCredentialRecord.builder()
            .credentialId(Bytes.fromByteArray(credentialId))
            .userEntityUserId(Bytes.fromByteArray(uuidToBytes(userId)))
            .publicKey(PublicKeyCose.fromByteArray(publicKey))
            .signatureCount(signCount)
            .build()

    private fun uuidToBytes(uuid: UUID): ByteArray {
        val buffer = ByteBuffer.allocate(16)
        buffer.putLong(uuid.mostSignificantBits)
        buffer.putLong(uuid.leastSignificantBits)
        return buffer.array()
    }

    private fun bytesToUuid(bytes: ByteArray): UUID? {
        if (bytes.size != 16) return null
        val buffer = ByteBuffer.wrap(bytes)
        return UUID(buffer.long, buffer.long)
    }
}
