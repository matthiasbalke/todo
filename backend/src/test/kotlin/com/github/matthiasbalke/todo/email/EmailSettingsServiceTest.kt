package com.github.matthiasbalke.todo.email

import com.github.matthiasbalke.todo.auth.AppSetting
import com.github.matthiasbalke.todo.auth.AppSettingRepository
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers
import org.mockito.Mockito
import org.springframework.boot.mail.autoconfigure.MailProperties
import java.util.Optional
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class EmailSettingsServiceTest {

    @Test
    fun `deployment configuration is active when no runtime snapshot exists`() {
        val service = service(
            mailProperties = mailProperties(
                host = "smtp.example.com",
                port = 587,
                username = "mailer",
                password = "secret",
            ),
            emailProperties = emailProperties(enabled = true, authEnabled = true),
        ).service

        val configuration = service.activeConfiguration()

        assertEquals(EmailConfigurationSource.DEPLOYMENT, configuration.source)
        assertEquals("smtp.example.com", configuration.host)
        assertEquals(587, configuration.port)
        assertEquals("mailer", configuration.username)
        assertTrue(configuration.passwordConfigured)
        assertTrue(configuration.validForSending)
    }

    @Test
    fun `disabled configuration can be incomplete`() {
        val configuration = EmailConfiguration(
            source = EmailConfigurationSource.DEPLOYMENT,
            enabled = false,
            authEnabled = true,
            host = "",
            port = null,
            protocol = "",
            encryption = EmailEncryption.STARTTLS,
            username = null,
            password = null,
            from = "",
            fromName = null,
        )

        assertTrue(configuration.validForSending)
        assertEquals(emptyList(), configuration.validationErrors())
    }

    @Test
    fun `enabled configuration requires core fields and auth credentials when auth is enabled`() {
        val configuration = EmailConfiguration(
            source = EmailConfigurationSource.RUNTIME,
            enabled = true,
            authEnabled = true,
            host = "",
            port = null,
            protocol = "",
            encryption = EmailEncryption.STARTTLS,
            username = null,
            password = null,
            from = "",
            fromName = null,
        )

        assertFalse(configuration.validForSending)
        assertEquals(
            listOf(
                "SMTP host is required",
                "SMTP port is required",
                "SMTP protocol is required",
                "Sender address is required",
                "SMTP username is required when authentication is enabled",
                "SMTP password is required when authentication is enabled",
            ),
            configuration.validationErrors(),
        )
    }

    @Test
    fun `enabled configuration rejects unsupported SMTP protocol`() {
        val configuration = EmailConfiguration(
            source = EmailConfigurationSource.RUNTIME,
            enabled = true,
            authEnabled = false,
            host = "smtp.example.com",
            port = 587,
            protocol = "smtps",
            encryption = EmailEncryption.STARTTLS,
            username = null,
            password = null,
            from = "todo@example.com",
            fromName = null,
        )

        assertEquals(listOf("SMTP protocol must be smtp"), configuration.validationErrors())
    }

    @Test
    fun `enabled email configuration does not require public app URL`() {
        val configuration = EmailConfiguration(
            source = EmailConfigurationSource.RUNTIME,
            enabled = true,
            authEnabled = false,
            host = "smtp.example.com",
            port = 587,
            protocol = "smtp",
            encryption = EmailEncryption.STARTTLS,
            username = null,
            password = null,
            from = "todo@example.com",
            fromName = null,
        )

        assertEquals(emptyList(), configuration.validationErrors())
    }

    @Test
    fun `saving first runtime snapshot with keep copies deployment password`() {
        val harness = service(
            mailProperties = mailProperties(
                host = "smtp.example.com",
                port = 587,
                username = "deploy-user",
                password = "deploy-secret",
            ),
            emailProperties = emailProperties(enabled = true, authEnabled = true),
        )

        val saved = harness.service.saveRuntimeSettings(validUpdate(passwordAction = PasswordAction.KEEP))

        assertEquals(EmailConfigurationSource.RUNTIME, saved.source)
        assertEquals("deploy-secret", saved.password)
        assertEquals("deploy-secret", harness.value(EmailSettingsService.PASSWORD_KEY))
        assertEquals("true", harness.value(EmailSettingsService.RUNTIME_CONFIGURED_KEY))
        assertEquals(EmailConfigurationSource.RUNTIME, harness.service.activeConfiguration().source)
    }

    @Test
    fun `clearing password is allowed when authentication is disabled`() {
        val harness = service()

        val saved = harness.service.saveRuntimeSettings(
            validUpdate(
                authEnabled = false,
                username = null,
                passwordAction = PasswordAction.CLEAR,
            )
        )

        assertFalse(saved.passwordConfigured)
        assertEquals("", harness.value(EmailSettingsService.PASSWORD_KEY))
    }

    @Test
    fun `clearing password fails when authentication is enabled`() {
        val service = service().service

        val error = assertFailsWith<InvalidEmailConfigurationException> {
            service.saveRuntimeSettings(validUpdate(passwordAction = PasswordAction.CLEAR))
        }
        assertEquals(listOf("SMTP password is required when authentication is enabled"), error.errors)
    }

    @Test
    fun `invalid update leaves previous runtime snapshot unchanged`() {
        val harness = service()
        harness.service.saveRuntimeSettings(validUpdate(password = "first-secret"))

        assertFailsWith<InvalidEmailConfigurationException> {
            harness.service.saveRuntimeSettings(validUpdate(password = "second-secret").copy(host = ""))
        }

        val active = harness.service.activeConfiguration()
        assertEquals("runtime.example.com", active.host)
        assertEquals("first-secret", active.password)
        assertEquals("runtime.example.com", harness.value(EmailSettingsService.HOST_KEY))
        assertEquals("first-secret", harness.value(EmailSettingsService.PASSWORD_KEY))
    }

    @Test
    fun `runtime SMTP settings do not read or write public app URL settings`() {
        val harness = service(
            initialSettings = listOf(
                AppSetting("app.publicBaseUrl", "https://public.example.com"),
                AppSetting("email.publicBaseUrl", "https://legacy.example.com"),
            )
        )

        harness.service.saveRuntimeSettings(validUpdate())

        assertEquals("https://public.example.com", harness.value("app.publicBaseUrl"))
        assertEquals("https://legacy.example.com", harness.value("email.publicBaseUrl"))
        assertEquals(EmailConfigurationSource.RUNTIME, harness.service.activeConfiguration().source)
    }

    @Test
    fun `reset removes runtime snapshot and returns to deployment source`() {
        val harness = service(
            mailProperties = mailProperties(host = "deployment.example.com"),
            emailProperties = emailProperties(enabled = false),
        )
        harness.service.saveRuntimeSettings(validUpdate(passwordAction = PasswordAction.REPLACE, password = "runtime-secret"))

        val reset = harness.service.resetToDeployment()

        assertEquals(EmailConfigurationSource.DEPLOYMENT, reset.source)
        assertEquals("deployment.example.com", reset.host)
        assertEquals(null, harness.value(EmailSettingsService.RUNTIME_CONFIGURED_KEY))
    }

    private data class Harness(
        val service: EmailSettingsService,
        val settings: MutableMap<String, AppSetting>,
    ) {
        fun value(key: String): String? = settings[key]?.value
    }

    private fun service(
        initialSettings: List<AppSetting> = emptyList(),
        mailProperties: MailProperties = mailProperties(host = ""),
        emailProperties: EmailProperties = emailProperties(),
    ): Harness {
        val settings = initialSettings.associateBy { it.key }.toMutableMap()
        val repository = Mockito.mock(AppSettingRepository::class.java)
        Mockito.`when`(repository.findAllById(ArgumentMatchers.anyIterable<String>())).thenAnswer { invocation ->
            @Suppress("UNCHECKED_CAST")
            val keys = invocation.arguments[0] as Iterable<String>
            keys.mapNotNull { settings[it] }
        }
        Mockito.`when`(repository.findById(ArgumentMatchers.anyString())).thenAnswer { invocation ->
            Optional.ofNullable(settings[invocation.arguments[0] as String])
        }
        Mockito.`when`(repository.save(ArgumentMatchers.any(AppSetting::class.java))).thenAnswer { invocation ->
            val setting = invocation.arguments[0] as AppSetting
            settings[setting.key] = setting
            setting
        }
        Mockito.doAnswer { invocation ->
            @Suppress("UNCHECKED_CAST")
            val keys = invocation.arguments[0] as Iterable<String>
            keys.forEach { settings.remove(it) }
            null
        }.`when`(repository).deleteAllById(ArgumentMatchers.anyIterable<String>())

        return Harness(EmailSettingsService(repository, mailProperties, emailProperties), settings)
    }

    private fun mailProperties(
        host: String,
        port: Int = 587,
        username: String? = null,
        password: String? = null,
    ): MailProperties {
        val properties = MailProperties()
        properties.host = host
        properties.port = port
        properties.username = username
        properties.password = password
        properties.protocol = EmailSettingsService.DEFAULT_PROTOCOL
        return properties
    }

    private fun emailProperties(
        enabled: Boolean = false,
        authEnabled: Boolean = false,
    ) = EmailProperties(
        enabled = enabled,
        auth = EmailProperties.Auth(enabled = authEnabled),
        encryption = EmailEncryption.STARTTLS,
        from = "todo@example.com",
        fromName = "Todo",
    )

    private fun validUpdate(
        authEnabled: Boolean = true,
        username: String? = "runtime-user",
        passwordAction: PasswordAction = PasswordAction.REPLACE,
        password: String? = "runtime-secret",
    ) = EmailSettingsUpdate(
        enabled = true,
        authEnabled = authEnabled,
        host = "runtime.example.com",
        port = 587,
        protocol = EmailSettingsService.DEFAULT_PROTOCOL,
        encryption = EmailEncryption.STARTTLS,
        username = username,
        passwordAction = passwordAction,
        password = password,
        from = "todo@example.com",
        fromName = "Todo",
    )
}
