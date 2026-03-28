package com.github.matthiasbalke.todo.auth

import org.springframework.security.web.webauthn.api.Bytes
import org.springframework.security.web.webauthn.api.ImmutablePublicKeyCredentialUserEntity
import org.springframework.security.web.webauthn.api.PublicKeyCredentialUserEntity
import org.springframework.security.web.webauthn.management.PublicKeyCredentialUserEntityRepository
import org.springframework.stereotype.Component
import java.util.Base64
import java.util.UUID

@Component
class PublicKeyCredentialUserEntityRepositoryImpl(
    private val userRepository: UserRepository,
) : PublicKeyCredentialUserEntityRepository {

    override fun findById(id: Bytes): PublicKeyCredentialUserEntity? {
        val userId = bytesToUuid(id.bytes) ?: return null
        val user = userRepository.findById(userId).orElse(null) ?: return null
        return user.toUserEntity()
    }

    override fun findByUsername(username: String): PublicKeyCredentialUserEntity? {
        val user = userRepository.findByEmail(username) ?: return null
        return user.toUserEntity()
    }

    override fun save(userEntity: PublicKeyCredentialUserEntity) {
        // Users are created in AuthController before the ceremony starts;
        // this is a no-op to satisfy the interface contract.
    }

    override fun delete(id: Bytes) {
        val userId = bytesToUuid(id.bytes) ?: return
        userRepository.deleteById(userId)
    }

    private fun User.toUserEntity(): PublicKeyCredentialUserEntity =
        ImmutablePublicKeyCredentialUserEntity.builder()
            .id(Bytes.fromBase64(Base64.getUrlEncoder().withoutPadding().encodeToString(uuidToBytes(id))))
            .name(email)
            .displayName(displayName)
            .build()
}
