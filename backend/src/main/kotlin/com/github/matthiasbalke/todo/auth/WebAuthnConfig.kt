package com.github.matthiasbalke.todo.auth

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.web.webauthn.api.ImmutablePublicKeyCredentialRpEntity
import org.springframework.security.web.webauthn.management.UserCredentialRepository
import org.springframework.security.web.webauthn.management.WebAuthnRelyingPartyOperations
import org.springframework.security.webauthn4j.Webauthn4JRelyingPartyOperations

@Configuration
class WebAuthnConfig(
    @Value("\${webauthn.rp.id}") private val rpId: String,
    @Value("\${webauthn.rp.name}") private val rpName: String,
    @Value("\${app.cors.allowed-origins}") private val allowedOrigins: String,
) {

    @Bean
    fun webAuthnRelyingPartyOperations(
        userEntityRepository: PublicKeyCredentialUserEntityRepositoryImpl,
        credentialRepository: UserCredentialRepository,
    ): WebAuthnRelyingPartyOperations {
        val rp = ImmutablePublicKeyCredentialRpEntity.builder()
            .id(rpId)
            .name(rpName)
            .build()

        val origins = buildSet {
            allowedOrigins.split(",").forEach { add(it.trim()) }
            // Always allow localhost in development
            add("http://localhost:8080")
            add("http://localhost:5173")
        }

        return Webauthn4JRelyingPartyOperations(userEntityRepository, credentialRepository, rp, origins)
    }
}
