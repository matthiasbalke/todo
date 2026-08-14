package com.github.matthiasbalke.todo.auth

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Service
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

interface SetupSecretGenerator {
    fun generate(): String
}

@Service
class SecureRandomSetupSecretGenerator : SetupSecretGenerator {
    private val random = SecureRandom()

    override fun generate(): String {
        val bytes = ByteArray(32)
        random.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }
}

@Service
class SetupSecretService(
    private val adminService: AdminService,
    private val setupSecretGenerator: SetupSecretGenerator,
    @Value("\${app.setup.secret:}") configuredSecret: String,
) {
    private val log = LoggerFactory.getLogger(SetupSecretService::class.java)
    private val configuredSetupSecret = configuredSecret.trim().takeIf { it.isNotEmpty() }

    @Volatile
    private var secretHash: ByteArray? = configuredSetupSecret?.let { hash(it) }

    @EventListener(ApplicationReadyEvent::class)
    fun initializeSetupSecret() {
        ensureReadyForSetup()
    }

    fun ensureReadyForSetup() {
        if (!adminService.setupRequired()) {
            clear()
            return
        }
        if (configuredSetupSecret != null) {
            log.info("First-admin setup is protected by the configured setup secret.")
            return
        }
        synchronized(this) {
            if (secretHash == null) {
                val secret = setupSecretGenerator.generate()
                secretHash = hash(secret)
                log.warn(
                    "First-admin setup is required. Open /setup and enter this setup secret: {}",
                    secret,
                )
            }
        }
    }

    fun isValid(submittedSecret: String?): Boolean {
        ensureReadyForSetup()
        val trimmed = submittedSecret?.trim().takeIf { !it.isNullOrEmpty() } ?: return false
        val expectedHash = secretHash ?: return false
        return MessageDigest.isEqual(expectedHash, hash(trimmed))
    }

    fun clear() {
        synchronized(this) {
            secretHash = configuredSetupSecret?.let { hash(it) }
        }
    }

    private fun hash(secret: String): ByteArray = MessageDigest.getInstance("SHA-256")
        .digest(secret.toByteArray(Charsets.UTF_8))
}
