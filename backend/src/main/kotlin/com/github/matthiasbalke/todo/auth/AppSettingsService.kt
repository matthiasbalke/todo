package com.github.matthiasbalke.todo.auth

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class AppSettingsService(
    private val appSettingRepository: AppSettingRepository,
    @Value("\${app.registration.enabled:true}") private val defaultRegistrationEnabled: Boolean,
) {

    fun isRegistrationEnabled(): Boolean =
        appSettingRepository.findById(REGISTRATION_ENABLED_KEY).orElse(null)?.value?.toBooleanStrictOrNull()
            ?: defaultRegistrationEnabled

    @Transactional
    fun setRegistrationEnabled(enabled: Boolean): Boolean {
        val setting = appSettingRepository.findById(REGISTRATION_ENABLED_KEY).orElse(null)
            ?: AppSetting(REGISTRATION_ENABLED_KEY, enabled.toString())
        setting.value = enabled.toString()
        setting.updatedAt = Instant.now()
        appSettingRepository.save(setting)
        return enabled
    }

    companion object {
        const val REGISTRATION_ENABLED_KEY = "registration.enabled"
    }
}
