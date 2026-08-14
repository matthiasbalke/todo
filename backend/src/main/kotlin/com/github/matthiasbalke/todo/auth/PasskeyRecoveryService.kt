package com.github.matthiasbalke.todo.auth

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Duration
import java.time.Instant
import java.util.Base64

@Service
class PasskeyRecoveryService(
    private val tokenRepository: PasskeyRecoveryTokenRepository,
    private val userRepository: UserRepository,
    @Value("\${app.cors.allowed-origins}") private val allowedOrigins: String,
) {

    @Transactional
    fun createRecovery(actor: User, target: User): RecoveryLink {
        if (target.blockedAt != null) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Cannot create recovery for blocked user")
        }
        val rawToken = generateToken()
        val token = tokenRepository.save(
            PasskeyRecoveryToken(
                userId = target.id,
                tokenHash = hash(rawToken),
                expiresAt = Instant.now().plus(DEFAULT_TTL),
                createdByUserId = actor.id,
            )
        )
        val base = publicBaseUrlFromAllowedOrigins(allowedOrigins)
        return RecoveryLink(
            tokenId = token.id.toString(),
            url = "$base/recover/$rawToken",
            expiresAt = token.expiresAt,
        )
    }

    fun resolve(rawToken: String): RecoveryContext {
        val token = tokenRepository.findByTokenHash(hash(rawToken))
            ?: throw RecoveryLinkException(
                HttpStatus.NOT_FOUND,
                "RECOVERY_LINK_INVALID",
                "Recovery link is invalid or expired",
            )
        if (token.consumedAt != null) {
            throw RecoveryLinkException(HttpStatus.GONE, "RECOVERY_LINK_USED", "Recovery link has already been used")
        }
        if (token.expiresAt.isBefore(Instant.now())) {
            throw RecoveryLinkException(HttpStatus.GONE, "RECOVERY_LINK_EXPIRED", "Recovery link has expired")
        }
        val user = userRepository.findById(token.userId).orElseThrow {
            RecoveryLinkException(HttpStatus.NOT_FOUND, "RECOVERY_LINK_INVALID", "Recovery link is invalid or expired")
        }
        if (user.blockedAt != null) {
            throw RecoveryLinkException(HttpStatus.CONFLICT, "ACCOUNT_BLOCKED", "Account is blocked")
        }
        return RecoveryContext(token, user)
    }

    @Transactional
    fun consume(rawToken: String): RecoveryContext {
        val context = resolve(rawToken)
        context.token.consumedAt = Instant.now()
        tokenRepository.save(context.token)
        return context
    }

    private fun generateToken(): String {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun hash(raw: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest(raw.toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it) }
    }

    data class RecoveryLink(val tokenId: String, val url: String, val expiresAt: Instant)
    data class RecoveryContext(val token: PasskeyRecoveryToken, val user: User)

    companion object {
        val DEFAULT_TTL: Duration = Duration.ofMinutes(30)

        fun publicBaseUrlFromAllowedOrigins(allowedOrigins: String): String {
            val firstOrigin = allowedOrigins.split(",")
                .map { it.trim() }
                .firstOrNull { it.isNotBlank() }
                ?: error("app.cors.allowed-origins must contain at least one origin")
            val normalized = when {
                firstOrigin.startsWith("https://") && firstOrigin.endsWith(":443") ->
                    firstOrigin.substringBeforeLast(":443")
                firstOrigin.startsWith("http://") && firstOrigin.endsWith(":80") ->
                    firstOrigin.substringBeforeLast(":80")
                else -> firstOrigin
            }
            return normalized.trimEnd('/')
        }
    }
}

class RecoveryLinkException(
    val status: HttpStatus,
    val code: String,
    override val message: String,
) : RuntimeException(message)
