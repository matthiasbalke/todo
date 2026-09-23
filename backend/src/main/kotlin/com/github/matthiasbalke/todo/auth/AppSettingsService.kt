package com.github.matthiasbalke.todo.auth

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.net.URI
import java.time.Duration
import java.time.Instant

data class AppSettings(
    val registrationEnabled: Boolean,
    val publicBaseUrl: String,
)

data class AppSettingsUpdate(
    val registrationEnabled: Boolean,
    val publicBaseUrl: String,
)

@Service
class AppSettingsService(
    private val appSettingRepository: AppSettingRepository,
    private val appProperties: AppProperties,
    @Value("\${app.registration.enabled:true}") private val defaultRegistrationEnabled: Boolean,
) {

    fun activeSettings(): AppSettings = AppSettings(
        registrationEnabled = isRegistrationEnabled(),
        publicBaseUrl = publicBaseUrl(),
    )

    fun isRegistrationEnabled(): Boolean =
        appSettingRepository.findById(REGISTRATION_ENABLED_KEY).orElse(null)?.value?.toBooleanStrictOrNull()
            ?: defaultRegistrationEnabled

    fun publicBaseUrl(): String =
        appSettingRepository.findById(PUBLIC_BASE_URL_KEY).orElse(null)?.value?.ifBlank { null }
            ?: appProperties.publicBaseUrl

    fun emailValidationTimeout(): Duration {
        val minutes = appSettingRepository.findById(EMAIL_VALIDATION_TIMEOUT_MINUTES_KEY)
            .orElse(null)
            ?.value
            ?.toLongOrNull()
            ?.takeIf { it > 0 }
            ?: DEFAULT_EMAIL_VALIDATION_TIMEOUT_MINUTES
        return Duration.ofMinutes(minutes)
    }

    @Transactional
    fun setRegistrationEnabled(enabled: Boolean): Boolean {
        val setting = appSettingRepository.findById(REGISTRATION_ENABLED_KEY).orElse(null)
            ?: AppSetting(REGISTRATION_ENABLED_KEY, enabled.toString())
        setting.value = enabled.toString()
        setting.updatedAt = Instant.now()
        appSettingRepository.save(setting)
        return enabled
    }

    @Transactional
    fun saveAppSettings(update: AppSettingsUpdate): AppSettings {
        val normalizedPublicBaseUrl = update.publicBaseUrl.trim()
        validatePublicBaseUrl(normalizedPublicBaseUrl)
        saveSetting(REGISTRATION_ENABLED_KEY, update.registrationEnabled.toString())
        saveSetting(PUBLIC_BASE_URL_KEY, normalizedPublicBaseUrl)
        return AppSettings(
            registrationEnabled = update.registrationEnabled,
            publicBaseUrl = normalizedPublicBaseUrl,
        )
    }

    private fun saveSetting(key: String, value: String) {
        val setting = appSettingRepository.findById(key).orElse(null) ?: AppSetting(key, value)
        setting.value = value
        setting.updatedAt = Instant.now()
        appSettingRepository.save(setting)
    }

    private fun validatePublicBaseUrl(value: String) {
        if (value.isBlank()) {
            throw InvalidAppSettingsException(listOf("Public application base URL is required"))
        }
        if (!validPublicBaseUrl(value)) {
            throw InvalidAppSettingsException(
                listOf("Public app URL must look like https://todo.example.com without a trailing slash")
            )
        }
    }

    companion object {
        const val REGISTRATION_ENABLED_KEY = "app.registration.enabled"
        const val PUBLIC_BASE_URL_KEY = "app.publicBaseUrl"
        const val EMAIL_VALIDATION_TIMEOUT_MINUTES_KEY = "app.emailValidationTimeoutMinutes"
        const val DEFAULT_EMAIL_VALIDATION_TIMEOUT_MINUTES = 30L

        fun validPublicBaseUrl(value: String): Boolean {
            if (value.endsWith("/")) return false
            val uri = runCatching { URI(value) }.getOrNull() ?: return false
            return uri.scheme in setOf("http", "https") && !uri.host.isNullOrBlank()
        }
    }
}

class InvalidAppSettingsException(val errors: List<String>) : RuntimeException(errors.joinToString("; "))
