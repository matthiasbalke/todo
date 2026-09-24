package com.github.matthiasbalke.todo.email

import jakarta.mail.internet.InternetAddress
import jakarta.mail.MessagingException
import org.springframework.mail.MailAuthenticationException
import org.springframework.mail.MailException
import org.springframework.mail.MailSendException
import org.springframework.mail.javamail.JavaMailSenderImpl
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service
import java.net.ConnectException
import java.net.NoRouteToHostException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.util.Properties
import javax.net.ssl.SSLException

data class OutboundEmail(
    val recipient: String,
    val subject: String,
    val text: String,
)

enum class EmailFailureCategory {
    AUTHENTICATION,
    SERVER_UNREACHABLE,
    TLS,
    PROVIDER_REJECTED,
    CONFIGURATION,
    UNKNOWN,
}

sealed interface EmailDeliveryResult {
    data object Accepted : EmailDeliveryResult
    data class Unavailable(val reasons: List<String>) : EmailDeliveryResult
    data class Failed(
        val category: EmailFailureCategory,
        val message: String,
        val detail: String? = null,
        val hint: String? = null,
    ) : EmailDeliveryResult
}

@Service
class EmailDeliveryService(
    private val emailSettingsService: EmailSettingsService,
    private val smtpMailSender: SmtpMailSender,
) {

    fun send(email: OutboundEmail): EmailDeliveryResult {
        val configuration = emailSettingsService.activeConfiguration()
        if (!configuration.enabled) return EmailDeliveryResult.Unavailable(listOf("Email delivery is disabled"))
        val errors = configuration.validationErrors()
        if (errors.isNotEmpty()) return EmailDeliveryResult.Unavailable(errors)

        return try {
            smtpMailSender.send(configuration, email)
            EmailDeliveryResult.Accepted
        } catch (error: MailAuthenticationException) {
            EmailDeliveryResult.Failed(
                EmailFailureCategory.AUTHENTICATION,
                "Email provider authentication failed",
                detail = "The SMTP server rejected the configured username or password.",
                hint = "Check whether SMTP authentication is required and verify the username and password.",
            )
        } catch (error: MailSendException) {
            error.toSafeFailure(configuration, "Email provider rejected the message")
        } catch (error: MailException) {
            error.toSafeFailure(configuration, "Email delivery failed")
        } catch (error: IllegalArgumentException) {
            EmailDeliveryResult.Failed(
                EmailFailureCategory.CONFIGURATION,
                "Email configuration is invalid",
                detail = "The configured SMTP settings could not be used to build the message.",
                hint = "Review the sender email, sender name, host, port, protocol, and encryption settings.",
            )
        } catch (error: Exception) {
            EmailDeliveryResult.Failed(
                EmailFailureCategory.UNKNOWN,
                "Email delivery failed",
                detail = "The SMTP test failed before the provider accepted the message.",
                hint = "Review the SMTP settings and backend logs for additional context.",
            )
        }
    }

    fun testEmail(recipient: String): EmailDeliveryResult = send(testMessage(recipient))

    private fun Throwable.toSafeFailure(
        configuration: EmailConfiguration,
        providerMessage: String,
    ): EmailDeliveryResult.Failed = when {
        isServerUnreachable() -> EmailDeliveryResult.Failed(
            EmailFailureCategory.SERVER_UNREACHABLE,
            "Email server is not reachable",
            detail = "Could not connect to ${configuration.host}:${configuration.port ?: EmailSettingsService.defaultPort(configuration.encryption)} within the SMTP timeout.",
            hint = "Check the SMTP host, port, firewall, and whether the provider expects STARTTLS or SSL/TLS.",
        )
        isTlsFailure() -> EmailDeliveryResult.Failed(
            EmailFailureCategory.TLS,
            "TLS negotiation failed",
            detail = "The SMTP server connection could not complete TLS negotiation for ${configuration.host}.",
            hint = "Check the SMTP hostname, certificate trust chain, and selected encryption mode.",
        )
        else -> EmailDeliveryResult.Failed(
            EmailFailureCategory.PROVIDER_REJECTED,
            providerMessage,
            detail = "The SMTP server rejected the test message after the connection was established.",
            hint = "Check the sender address, recipient address, provider policy, and any SMTP relay restrictions.",
        )
    }

    private fun Throwable.isServerUnreachable(): Boolean =
        flattenCauses().any { cause ->
            cause is ConnectException ||
                cause is SocketTimeoutException ||
                cause is UnknownHostException ||
                cause is NoRouteToHostException ||
                cause.javaClass.name.endsWith(".MailConnectException")
        }

    private fun Throwable.isTlsFailure(): Boolean =
        flattenCauses().any { cause ->
            cause is SSLException ||
                cause.message?.contains("STARTTLS", ignoreCase = true) == true ||
                cause.message?.contains("TLS", ignoreCase = true) == true
        }

    private fun Throwable.flattenCauses(): Sequence<Throwable> = sequence {
        val seen = mutableSetOf<Throwable>()
        var current: Throwable? = this@flattenCauses
        while (current != null && seen.add(current)) {
            yield(current)
            if (current is MessagingException) {
                current.nextException?.let { yieldAll(it.flattenCauses()) }
            }
            if (current is MailSendException) {
                current.messageExceptions.forEach { yieldAll(it.flattenCauses()) }
            }
            current = current.cause
        }
    }

    companion object {
        const val TEST_EMAIL_SUBJECT = "Todo email settings test"
        private const val TEST_EMAIL_BODY =
            "This is a test message from Todo. If you received it, outbound email delivery is configured."

        fun testMessage(recipient: String): OutboundEmail = OutboundEmail(
            recipient = recipient.trim(),
            subject = TEST_EMAIL_SUBJECT,
            text = TEST_EMAIL_BODY,
        )
    }
}

interface SmtpMailSender {
    fun send(configuration: EmailConfiguration, email: OutboundEmail)
}

@Service
class JavaMailSmtpMailSender : SmtpMailSender {

    override fun send(configuration: EmailConfiguration, email: OutboundEmail) {
        val sender = createSender(configuration)
        val message = sender.createMimeMessage()
        val helper = MimeMessageHelper(message, false, "UTF-8")
        helper.setFrom(fromAddress(configuration))
        helper.setTo(email.recipient)
        helper.setSubject(email.subject)
        helper.setText(email.text, false)
        sender.send(message)
    }

    fun createSender(configuration: EmailConfiguration): JavaMailSenderImpl {
        val sender = JavaMailSenderImpl()
        sender.host = configuration.host
        sender.port = configuration.port ?: EmailSettingsService.defaultPort(configuration.encryption)
        sender.protocol = configuration.protocol
        if (configuration.authEnabled) {
            sender.username = configuration.username
            sender.password = configuration.password
        }
        sender.javaMailProperties = javaMailProperties(configuration)
        return sender
    }

    fun javaMailProperties(configuration: EmailConfiguration): Properties = Properties().apply {
        put("mail.smtp.auth", configuration.authEnabled.toString())
        put("mail.smtp.connectiontimeout", "5000")
        put("mail.smtp.timeout", "5000")
        put("mail.smtp.writetimeout", "5000")
        when (configuration.encryption) {
            EmailEncryption.STARTTLS -> {
                put("mail.smtp.starttls.enable", "true")
                put("mail.smtp.starttls.required", "true")
                put("mail.smtp.ssl.enable", "false")
            }
            EmailEncryption.SSL_TLS -> {
                put("mail.smtp.ssl.enable", "true")
                put("mail.smtp.ssl.checkserveridentity", "true")
            }
        }
    }

    private fun fromAddress(configuration: EmailConfiguration): InternetAddress =
        if (configuration.fromName.isNullOrBlank()) {
            InternetAddress(configuration.from)
        } else {
            InternetAddress(configuration.from, configuration.fromName)
        }
}
