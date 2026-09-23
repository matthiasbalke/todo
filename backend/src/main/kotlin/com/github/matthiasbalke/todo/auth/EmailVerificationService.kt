package com.github.matthiasbalke.todo.auth

import com.github.matthiasbalke.todo.email.EmailDeliveryResult
import com.github.matthiasbalke.todo.email.EmailDeliveryService
import com.github.matthiasbalke.todo.email.OutboundEmail
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.security.SecureRandom
import java.time.Instant
import java.util.Base64
import java.util.UUID

data class VerificationAttemptDto(
    val email: String,
    val tokenRequested: Boolean,
    val startedAt: Instant?,
    val expiresAt: Instant?,
    val expired: Boolean,
)

data class EmailVerificationStateDto(
    val emailVerified: Boolean,
    val activeEmail: String,
    val registrationVerification: VerificationAttemptDto?,
    val pendingEmailChange: VerificationAttemptDto?,
)

data class VerificationEmailRequestResponse(
    val status: String,
    val message: String,
)

data class VerificationSubmitRequest(val validationToken: String?)

data class VerificationSubmitResponse(
    val status: String,
    val message: String,
    val emailVerified: Boolean,
    val activeEmail: String,
)

enum class VerificationPurpose {
    REGISTRATION,
    PENDING_EMAIL,
}

class EmailVerificationException(
    val code: String,
    val status: HttpStatus,
    message: String,
) : RuntimeException(message)

@Service
class EmailVerificationService(
    private val userRepository: UserRepository,
    private val appSettingsService: AppSettingsService,
    private val jwtTokenService: JwtTokenService,
    private val applicationLinkService: ApplicationLinkService,
    private val emailDeliveryService: EmailDeliveryService,
) {
    private val secureRandom = SecureRandom()

    fun state(userId: UUID): EmailVerificationStateDto {
        val user = findUser(userId)
        val now = Instant.now()
        return user.toState(now)
    }

    @Transactional
    fun requestVerificationEmail(userId: UUID): VerificationEmailRequestResponse {
        val user = findUser(userId)
        return if (user.validatedAt == null) {
            val rawToken = newToken()
            user.validationToken = jwtTokenService.hashToken(rawToken)
            user.validationStarted = Instant.now()
            userRepository.save(user)
            sendVerificationEmail(
                recipient = user.email,
                displayName = user.displayName,
                token = rawToken,
                purpose = VerificationPurpose.REGISTRATION,
            )
            VerificationEmailRequestResponse("SENT", "Verification email requested.")
        } else if (user.pendingEmail != null) {
            val rawToken = newToken()
            user.pendingEmailToken = jwtTokenService.hashToken(rawToken)
            user.pendingEmailStarted = Instant.now()
            userRepository.save(user)
            sendVerificationEmail(
                recipient = user.pendingEmail!!,
                displayName = user.displayName,
                token = rawToken,
                purpose = VerificationPurpose.PENDING_EMAIL,
            )
            sendEmailChangeNotice(user)
            VerificationEmailRequestResponse("SENT", "Verification email requested.")
        } else {
            VerificationEmailRequestResponse("ALREADY_VERIFIED", "Account email is already verified.")
        }
    }

    @Transactional
    fun submitToken(userId: UUID, rawToken: String?): VerificationSubmitResponse {
        val token = rawToken?.trim().orEmpty()
        if (token.isBlank()) {
            throw EmailVerificationException("VALIDATION_TOKEN_REQUIRED", HttpStatus.BAD_REQUEST, "Verification token is required.")
        }

        val user = findUser(userId)
        if (user.validatedAt == null) {
            verifyRegistration(user, token)
            return VerificationSubmitResponse(
                status = "VERIFIED",
                message = "Email address verified.",
                emailVerified = true,
                activeEmail = user.email,
            )
        }

        if (user.pendingEmail != null) {
            verifyPendingEmail(user, token)
            return VerificationSubmitResponse(
                status = "VERIFIED",
                message = "Email address verified.",
                emailVerified = true,
                activeEmail = user.email,
            )
        }

        return VerificationSubmitResponse(
            status = "ALREADY_VERIFIED",
            message = "Account email is already verified.",
            emailVerified = true,
            activeEmail = user.email,
        )
    }

    @Transactional
    fun cancelPendingEmail(userId: UUID): EmailVerificationStateDto {
        val user = findUser(userId)
        user.pendingEmail = null
        user.pendingEmailToken = null
        user.pendingEmailStarted = null
        return userRepository.save(user).toState(Instant.now())
    }

    @Transactional
    fun startPendingEmailChange(userId: UUID, pendingEmail: String): User {
        val user = findUser(userId)
        val trimmedEmail = pendingEmail.trim()
        if (trimmedEmail.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Email cannot be blank")
        }
        if (userRepository.existsByActiveOrPendingEmailIdentityAndIdNot(trimmedEmail, userId)) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use")
        }
        val rawToken = newToken()
        user.pendingEmail = trimmedEmail
        user.pendingEmailToken = jwtTokenService.hashToken(rawToken)
        user.pendingEmailStarted = Instant.now()
        val saved = userRepository.save(user)
        sendVerificationEmail(
            recipient = trimmedEmail,
            displayName = user.displayName,
            token = rawToken,
            purpose = VerificationPurpose.PENDING_EMAIL,
        )
        sendEmailChangeNotice(saved)
        return saved
    }

    private fun verifyRegistration(user: User, token: String) {
        validateToken(
            submittedToken = token,
            expectedHash = user.validationToken,
            startedAt = user.validationStarted,
        )
        user.validatedAt = Instant.now()
        user.validationToken = null
        user.validationStarted = null
        userRepository.save(user)
    }

    private fun verifyPendingEmail(user: User, token: String) {
        val pendingEmail = user.pendingEmail ?: return
        validateToken(
            submittedToken = token,
            expectedHash = user.pendingEmailToken,
            startedAt = user.pendingEmailStarted,
        )
        user.email = pendingEmail
        user.validatedAt = Instant.now()
        user.pendingEmail = null
        user.pendingEmailToken = null
        user.pendingEmailStarted = null
        userRepository.save(user)
    }

    private fun validateToken(submittedToken: String, expectedHash: String?, startedAt: Instant?) {
        if (expectedHash == null || startedAt == null) {
            throw EmailVerificationException("VALIDATION_TOKEN_INVALID", HttpStatus.BAD_REQUEST, "Verification token is invalid.")
        }
        if (isExpired(startedAt, Instant.now())) {
            throw EmailVerificationException("VALIDATION_TOKEN_EXPIRED", HttpStatus.GONE, "Verification token is no longer valid.")
        }
        if (jwtTokenService.hashToken(submittedToken) != expectedHash) {
            throw EmailVerificationException("VALIDATION_TOKEN_INVALID", HttpStatus.BAD_REQUEST, "Verification token is invalid.")
        }
    }

    private fun sendVerificationEmail(
        recipient: String,
        displayName: String,
        token: String,
        purpose: VerificationPurpose,
    ) {
        val link = applicationLinkService.url(AppRoute.EmailVerification(token))
        val subject = when (purpose) {
            VerificationPurpose.REGISTRATION -> "Verify your Todo email address"
            VerificationPurpose.PENDING_EMAIL -> "Verify your new Todo email address"
        }
        val body = """
            Hello $displayName,

            Use this token to verify your email address:

            $token

            Or open this link:
            $link

            This verification token expires in ${appSettingsService.emailValidationTimeout().toMinutes()} minutes.
        """.trimIndent()
        handleDelivery(emailDeliveryService.send(OutboundEmail(recipient, subject, body)))
    }

    private fun sendEmailChangeNotice(user: User) {
        val pendingEmail = user.pendingEmail ?: return
        val body = """
            Hello ${user.displayName},

            A request was made to change your Todo account email address to $pendingEmail.

            If this was you, verify the new email address using the message sent there.
        """.trimIndent()
        emailDeliveryService.send(
            OutboundEmail(
                recipient = user.email,
                subject = "Todo account email change requested",
                text = body,
            )
        )
    }

    private fun handleDelivery(result: EmailDeliveryResult) {
        when (result) {
            EmailDeliveryResult.Accepted -> Unit
            is EmailDeliveryResult.Unavailable -> throw EmailVerificationException(
                "EMAIL_DELIVERY_UNAVAILABLE",
                HttpStatus.SERVICE_UNAVAILABLE,
                "Email delivery is unavailable.",
            )
            is EmailDeliveryResult.Failed -> throw EmailVerificationException(
                "EMAIL_DELIVERY_FAILED",
                HttpStatus.BAD_GATEWAY,
                result.message,
            )
        }
    }

    private fun User.toState(now: Instant): EmailVerificationStateDto = EmailVerificationStateDto(
        emailVerified = validatedAt != null,
        activeEmail = email,
        registrationVerification = if (validatedAt == null) {
            verificationAttempt(email, validationToken, validationStarted, now)
        } else {
            null
        },
        pendingEmailChange = pendingEmail?.let {
            verificationAttempt(it, pendingEmailToken, pendingEmailStarted, now)
        },
    )

    private fun verificationAttempt(
        email: String,
        tokenHash: String?,
        startedAt: Instant?,
        now: Instant,
    ): VerificationAttemptDto {
        val expiresAt = startedAt?.plus(appSettingsService.emailValidationTimeout())
        return VerificationAttemptDto(
            email = email,
            tokenRequested = tokenHash != null && startedAt != null,
            startedAt = startedAt,
            expiresAt = expiresAt,
            expired = expiresAt?.isBefore(now) == true,
        )
    }

    private fun isExpired(startedAt: Instant, now: Instant): Boolean =
        startedAt.plus(appSettingsService.emailValidationTimeout()).isBefore(now)

    private fun findUser(userId: UUID): User = userRepository.findById(userId).orElseThrow {
        ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")
    }

    private fun newToken(): String {
        val bytes = ByteArray(32)
        secureRandom.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }
}
