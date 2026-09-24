package com.github.matthiasbalke.todo.email

import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.mail.MailAuthenticationException
import org.springframework.mail.MailSendException
import java.net.ConnectException
import java.net.SocketTimeoutException
import kotlin.test.assertEquals
import kotlin.test.assertIs

class EmailDeliveryServiceTest {

    @Test
    fun `send reports unavailable when active configuration is disabled`() {
        val service = EmailDeliveryService(
            settingsService(configuration(enabled = false, host = "")),
            RecordingSmtpMailSender(),
        )

        val result = service.send(OutboundEmail("user@example.com", "Subject", "Body"))

        assertIs<EmailDeliveryResult.Unavailable>(result)
    }

    @Test
    fun `send delegates valid messages to SMTP sender`() {
        val sender = RecordingSmtpMailSender()
        val service = EmailDeliveryService(settingsService(configuration()), sender)

        val result = service.send(OutboundEmail("user@example.com", "Subject", "Body"))

        assertEquals(EmailDeliveryResult.Accepted, result)
        assertEquals("user@example.com", sender.sent.single().recipient)
    }

    @Test
    fun `authentication failures return safe category and message`() {
        val service = EmailDeliveryService(
            settingsService(configuration()),
            ThrowingSmtpMailSender(MailAuthenticationException("secret leaked by provider")),
        )

        val result = service.send(OutboundEmail("user@example.com", "Subject", "Body"))

        assertEquals(
            EmailDeliveryResult.Failed(
                EmailFailureCategory.AUTHENTICATION,
                "Email provider authentication failed",
                detail = "The SMTP server rejected the configured username or password.",
                hint = "Check whether SMTP authentication is required and verify the username and password.",
            ),
            result,
        )
    }

    @Test
    fun `connection failures return server unreachable category and message`() {
        val service = EmailDeliveryService(
            settingsService(configuration()),
            ThrowingSmtpMailSender(MailSendException("connect failed", ConnectException("Connection refused"))),
        )

        val result = service.send(OutboundEmail("user@example.com", "Subject", "Body"))

        assertEquals(
            EmailDeliveryResult.Failed(
                EmailFailureCategory.SERVER_UNREACHABLE,
                "Email server is not reachable",
                detail = "Could not connect to smtp.example.com:587 within the SMTP timeout.",
                hint = "Check the SMTP host, port, firewall, and whether the provider expects STARTTLS or SSL/TLS.",
            ),
            result,
        )
    }

    @Test
    fun `timeout failures return server unreachable category and message`() {
        val service = EmailDeliveryService(
            settingsService(configuration()),
            ThrowingSmtpMailSender(MailSendException("timed out", SocketTimeoutException("Connect timed out"))),
        )

        val result = service.send(OutboundEmail("user@example.com", "Subject", "Body"))

        assertEquals(
            EmailDeliveryResult.Failed(
                EmailFailureCategory.SERVER_UNREACHABLE,
                "Email server is not reachable",
                detail = "Could not connect to smtp.example.com:587 within the SMTP timeout.",
                hint = "Check the SMTP host, port, firewall, and whether the provider expects STARTTLS or SSL/TLS.",
            ),
            result,
        )
    }

    @Test
    fun `provider send failures return provider rejected category and message`() {
        val service = EmailDeliveryService(
            settingsService(configuration()),
            ThrowingSmtpMailSender(MailSendException("provider rejected")),
        )

        val result = service.send(OutboundEmail("user@example.com", "Subject", "Body"))

        assertEquals(
            EmailDeliveryResult.Failed(
                EmailFailureCategory.PROVIDER_REJECTED,
                "Email provider rejected the message",
                detail = "The SMTP server rejected the test message after the connection was established.",
                hint = "Check the sender address, recipient address, provider policy, and any SMTP relay restrictions.",
            ),
            result,
        )
    }

    @Test
    fun `test email uses fixed subject and body`() {
        val message = EmailDeliveryService.testMessage(" test@example.com ")

        assertEquals("test@example.com", message.recipient)
        assertEquals(EmailDeliveryService.TEST_EMAIL_SUBJECT, message.subject)
        assertEquals(
            "This is a test message from Todo. If you received it, outbound email delivery is configured.",
            message.text,
        )
    }

    @Test
    fun `STARTTLS sender properties enable and require STARTTLS`() {
        val properties = JavaMailSmtpMailSender().javaMailProperties(configuration(encryption = EmailEncryption.STARTTLS))

        assertEquals("true", properties["mail.smtp.starttls.enable"])
        assertEquals("true", properties["mail.smtp.starttls.required"])
        assertEquals("false", properties["mail.smtp.ssl.enable"])
    }

    @Test
    fun `SSL TLS sender properties enable implicit SSL`() {
        val properties = JavaMailSmtpMailSender().javaMailProperties(configuration(encryption = EmailEncryption.SSL_TLS))

        assertEquals("true", properties["mail.smtp.ssl.enable"])
        assertEquals("true", properties["mail.smtp.ssl.checkserveridentity"])
    }

    private class RecordingSmtpMailSender : SmtpMailSender {
        val sent = mutableListOf<OutboundEmail>()

        override fun send(configuration: EmailConfiguration, email: OutboundEmail) {
            sent += email
        }
    }

    private class ThrowingSmtpMailSender(private val error: RuntimeException) : SmtpMailSender {
        override fun send(configuration: EmailConfiguration, email: OutboundEmail) {
            throw error
        }
    }

    private fun settingsService(configuration: EmailConfiguration): EmailSettingsService {
        val service = Mockito.mock(EmailSettingsService::class.java)
        Mockito.`when`(service.activeConfiguration()).thenReturn(configuration)
        return service
    }

    private fun configuration(
        enabled: Boolean = true,
        host: String = "smtp.example.com",
        encryption: EmailEncryption = EmailEncryption.STARTTLS,
    ) = EmailConfiguration(
        source = EmailConfigurationSource.RUNTIME,
        enabled = enabled,
        authEnabled = true,
        host = host,
        port = EmailSettingsService.defaultPort(encryption),
        protocol = EmailSettingsService.DEFAULT_PROTOCOL,
        encryption = encryption,
        username = "user",
        password = "secret",
        from = "todo@example.com",
        fromName = "Todo",
    )
}
