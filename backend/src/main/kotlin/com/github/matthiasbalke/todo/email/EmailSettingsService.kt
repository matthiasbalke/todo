package com.github.matthiasbalke.todo.email

import com.github.matthiasbalke.todo.auth.AppSetting
import com.github.matthiasbalke.todo.auth.AppSettingRepository
import org.springframework.boot.mail.autoconfigure.MailProperties
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class EmailSettingsService(
    private val appSettingRepository: AppSettingRepository,
    private val mailProperties: MailProperties,
    private val emailProperties: EmailProperties,
) {

    fun activeConfiguration(): EmailConfiguration {
        val settings = readRuntimeSettings()
        return if (settings[RUNTIME_CONFIGURED_KEY]?.toBooleanStrictOrNull() == true) {
            configurationFromRuntime(settings)
        } else {
            configurationFromDeployment()
        }
    }

    fun isDeliveryAvailable(): Boolean {
        val configuration = activeConfiguration()
        return configuration.enabled && configuration.validationErrors().isEmpty()
    }

    @Transactional
    fun saveRuntimeSettings(update: EmailSettingsUpdate): EmailConfiguration {
        val active = activeConfiguration()
        val password = resolvePassword(update, active)
        val configuration = EmailConfiguration(
            source = EmailConfigurationSource.RUNTIME,
            enabled = update.enabled,
            authEnabled = update.authEnabled,
            host = update.host.trim(),
            port = update.port,
            protocol = update.protocol.trim().ifBlank { DEFAULT_PROTOCOL },
            encryption = update.encryption,
            username = update.username?.trim()?.ifBlank { null },
            password = password,
            from = update.from.trim(),
            fromName = update.fromName?.trim()?.ifBlank { null },
        )
        val errors = configuration.validationErrors()
        if (errors.isNotEmpty()) throw InvalidEmailConfigurationException(errors)

        saveSetting(RUNTIME_CONFIGURED_KEY, true.toString())
        saveSetting(ENABLED_KEY, configuration.enabled.toString())
        saveSetting(AUTH_ENABLED_KEY, configuration.authEnabled.toString())
        saveSetting(HOST_KEY, configuration.host)
        saveSetting(PORT_KEY, configuration.port?.toString().orEmpty())
        saveSetting(PROTOCOL_KEY, configuration.protocol)
        saveSetting(ENCRYPTION_KEY, configuration.encryption.name)
        saveSetting(USERNAME_KEY, configuration.username.orEmpty())
        saveSetting(PASSWORD_KEY, configuration.password.orEmpty())
        saveSetting(FROM_KEY, configuration.from)
        saveSetting(FROM_NAME_KEY, configuration.fromName.orEmpty())
        return configuration
    }

    @Transactional
    fun resetToDeployment(): EmailConfiguration {
        appSettingRepository.deleteAllById(EMAIL_KEYS)
        return activeConfiguration()
    }

    private fun resolvePassword(update: EmailSettingsUpdate, active: EmailConfiguration): String? = when (update.passwordAction) {
        PasswordAction.KEEP -> active.password
        PasswordAction.REPLACE -> update.password?.trim()?.ifBlank { null }
        PasswordAction.CLEAR -> {
            if (update.enabled && update.authEnabled) {
                throw InvalidEmailConfigurationException(
                    listOf("SMTP password is required when authentication is enabled")
                )
            }
            null
        }
    }

    private fun configurationFromDeployment(): EmailConfiguration = EmailConfiguration(
        source = EmailConfigurationSource.DEPLOYMENT,
        enabled = emailProperties.enabled,
        authEnabled = emailProperties.auth.enabled,
        host = mailProperties.host.orEmpty(),
        port = mailProperties.port ?: defaultPort(emailProperties.encryption),
        protocol = mailProperties.protocol.ifBlank { DEFAULT_PROTOCOL },
        encryption = emailProperties.encryption,
        username = mailProperties.username?.ifBlank { null },
        password = mailProperties.password?.ifBlank { null },
        from = emailProperties.from,
        fromName = emailProperties.fromName.ifBlank { null },
    )

    private fun configurationFromRuntime(settings: Map<String, String>): EmailConfiguration {
        val encryption = settings[ENCRYPTION_KEY]?.let {
            runCatching { EmailEncryption.valueOf(it) }.getOrNull()
        } ?: EmailEncryption.STARTTLS
        return EmailConfiguration(
            source = EmailConfigurationSource.RUNTIME,
            enabled = settings[ENABLED_KEY]?.toBooleanStrictOrNull() ?: false,
            authEnabled = settings[AUTH_ENABLED_KEY]?.toBooleanStrictOrNull() ?: false,
            host = settings[HOST_KEY].orEmpty(),
            port = settings[PORT_KEY]?.toIntOrNull(),
            protocol = settings[PROTOCOL_KEY]?.ifBlank { DEFAULT_PROTOCOL } ?: DEFAULT_PROTOCOL,
            encryption = encryption,
            username = settings[USERNAME_KEY]?.ifBlank { null },
            password = settings[PASSWORD_KEY]?.ifBlank { null },
            from = settings[FROM_KEY].orEmpty(),
            fromName = settings[FROM_NAME_KEY]?.ifBlank { null },
        )
    }

    private fun readRuntimeSettings(): Map<String, String> =
        appSettingRepository.findAllById(EMAIL_KEYS)
            .associate { it.key to it.value }

    private fun saveSetting(key: String, value: String) {
        val setting = appSettingRepository.findById(key).orElse(null) ?: AppSetting(key, value)
        setting.value = value
        setting.updatedAt = Instant.now()
        appSettingRepository.save(setting)
    }

    companion object {
        const val DEFAULT_PROTOCOL = "smtp"
        const val RUNTIME_CONFIGURED_KEY = "email.runtimeConfigured"
        const val ENABLED_KEY = "email.enabled"
        const val AUTH_ENABLED_KEY = "email.auth.enabled"
        const val HOST_KEY = "email.host"
        const val PORT_KEY = "email.port"
        const val PROTOCOL_KEY = "email.protocol"
        const val ENCRYPTION_KEY = "email.encryption"
        const val USERNAME_KEY = "email.username"
        const val PASSWORD_KEY = "email.password"
        const val FROM_KEY = "email.from"
        const val FROM_NAME_KEY = "email.fromName"
        val EMAIL_KEYS = listOf(
            RUNTIME_CONFIGURED_KEY,
            ENABLED_KEY,
            AUTH_ENABLED_KEY,
            HOST_KEY,
            PORT_KEY,
            PROTOCOL_KEY,
            ENCRYPTION_KEY,
            USERNAME_KEY,
            PASSWORD_KEY,
            FROM_KEY,
            FROM_NAME_KEY,
        )

        fun defaultPort(encryption: EmailEncryption): Int = when (encryption) {
            EmailEncryption.STARTTLS -> 587
            EmailEncryption.SSL_TLS -> 465
        }
    }
}

class InvalidEmailConfigurationException(val errors: List<String>) : RuntimeException(errors.joinToString("; "))
