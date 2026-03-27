package com.github.matthiasbalke.todo.auth

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.web.webauthn.api.AuthenticatorSelectionCriteria
import org.springframework.security.web.webauthn.api.PublicKeyCredentialRpEntity
import org.springframework.security.web.webauthn.api.ResidentKeyRequirement
import org.springframework.security.web.webauthn.api.UserVerificationRequirement
import org.springframework.security.web.webauthn.jackson.WebauthnJacksonModule
import org.springframework.security.web.webauthn.management.UserCredentialRepository
import org.springframework.security.web.webauthn.management.WebAuthnRelyingPartyOperations
import org.springframework.security.web.webauthn.management.Webauthn4JRelyingPartyOperations

@Configuration
class WebAuthnConfig(
    @Value("\${webauthn.rp.id}") private val rpId: String,
    @Value("\${webauthn.rp.name}") private val rpName: String,
    @Value("\${app.cors.allowed-origins}") private val allowedOrigins: String,
) {

    @Bean
    fun webAuthnJacksonModule() = WebauthnJacksonModule()

    @Bean
    fun webAuthnRelyingPartyOperations(
        userEntityRepository: PublicKeyCredentialUserEntityRepositoryImpl,
        credentialRepository: UserCredentialRepository,
    ): WebAuthnRelyingPartyOperations {
        val rp = PublicKeyCredentialRpEntity.builder()
            .id(rpId)
            .name(rpName)
            .build()

        val origins = buildSet {
            allowedOrigins.split(",").forEach { add(it.trim()) }
            // Always allow localhost in development
            add("http://localhost:8080")
            add("http://localhost:5173")
        }

        val ops = Webauthn4JRelyingPartyOperations(userEntityRepository, credentialRepository, rp, origins)
        ops.setCustomizeCreationOptions { builder ->
            builder.authenticatorSelection(
                AuthenticatorSelectionCriteria.builder()
                    .residentKey(ResidentKeyRequirement.REQUIRED)
                    .userVerification(UserVerificationRequirement.REQUIRED)
                    .build()
            )
        }
        ops.setCustomizeRequestOptions { builder ->
            builder.userVerification(UserVerificationRequirement.REQUIRED)
        }
        return ops
    }
}
