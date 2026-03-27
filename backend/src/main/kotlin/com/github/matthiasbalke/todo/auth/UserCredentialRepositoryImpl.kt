package com.github.matthiasbalke.todo.auth

import org.springframework.security.web.webauthn.api.Bytes
import org.springframework.security.web.webauthn.api.CredentialRecord
import org.springframework.security.web.webauthn.api.ImmutableCredentialRecord
import org.springframework.security.web.webauthn.api.ImmutablePublicKeyCose
import org.springframework.security.web.webauthn.management.UserCredentialRepository
import org.springframework.stereotype.Component
import java.nio.ByteBuffer
import java.util.Base64
import java.util.UUID

@Component
class UserCredentialRepositoryImpl(
    private val credentialRepository: WebAuthnCredentialRepository,
) : UserCredentialRepository {

    override fun save(credentialRecord: CredentialRecord) {
        val id = credentialRecord.credentialId.toBase64Url()
        val existing = credentialRepository.findByCredentialId(id)
        if (existing != null) {
            existing.signCount = credentialRecord.signatureCount
            credentialRepository.save(existing)
        } else {
            val userId = bytesToUuid(credentialRecord.userEntityUserId.bytes)
                ?: error("Invalid user handle in credential record")
            credentialRepository.save(
                WebAuthnCredential(
                    userId = userId,
                    credentialId = id,
                    publicKey = credentialRecord.publicKey.bytes,
                    signCount = credentialRecord.signatureCount,
                    attestationObject = credentialRecord.attestationObject?.bytes
                        ?: error("attestationObject is required on registration"),
                )
            )
        }
    }

    override fun findByCredentialId(credentialId: Bytes): CredentialRecord? {
        val credential = credentialRepository.findByCredentialId(credentialId.toBase64Url()) ?: return null
        return credential.toCredentialRecord()
    }

    override fun findByUserId(userId: Bytes): List<CredentialRecord> {
        val uuid = bytesToUuid(userId.bytes) ?: return emptyList()
        return credentialRepository.findAllByUserId(uuid).map { it.toCredentialRecord() }
    }

    override fun delete(credentialId: Bytes) {
        val credential = credentialRepository.findByCredentialId(credentialId.toBase64Url()) ?: return
        credentialRepository.delete(credential)
    }

    private fun WebAuthnCredential.toCredentialRecord(): CredentialRecord =
        ImmutableCredentialRecord.builder()
            .credentialId(Bytes(Base64.getUrlDecoder().decode(credentialId)))
            .userEntityUserId(Bytes(uuidToBytes(userId)))
            .publicKey(ImmutablePublicKeyCose(publicKey))
            .signatureCount(signCount)
            .attestationObject(Bytes(attestationObject))
            .transports(emptySet())
            .build()

    private fun Bytes.toBase64Url(): String =
        Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)

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
