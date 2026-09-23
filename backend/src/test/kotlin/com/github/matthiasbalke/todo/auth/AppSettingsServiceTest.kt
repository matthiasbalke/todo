package com.github.matthiasbalke.todo.auth

import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers
import org.mockito.Mockito
import java.util.Optional
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class AppSettingsServiceTest {

    @Test
    fun `app setting keys use app prefix matching app property paths`() {
        assertEquals("app.registration.enabled", AppSettingsService.REGISTRATION_ENABLED_KEY)
        assertEquals("app.publicBaseUrl", AppSettingsService.PUBLIC_BASE_URL_KEY)
    }

    @Test
    fun `active settings use deployment defaults when runtime settings are absent`() {
        val harness = service(defaultRegistrationEnabled = false, defaultPublicBaseUrl = "https://deploy.example.com")

        val settings = harness.service.activeSettings()

        assertEquals(false, settings.registrationEnabled)
        assertEquals("https://deploy.example.com", settings.publicBaseUrl)
    }

    @Test
    fun `app settings save trims and persists registration and public base url`() {
        val harness = service()

        val saved = harness.service.saveAppSettings(
            AppSettingsUpdate(
                registrationEnabled = false,
                publicBaseUrl = " https://todo.example.com ",
            )
        )

        assertEquals(false, saved.registrationEnabled)
        assertEquals("https://todo.example.com", saved.publicBaseUrl)
        assertEquals("false", harness.value(AppSettingsService.REGISTRATION_ENABLED_KEY))
        assertEquals("https://todo.example.com", harness.value(AppSettingsService.PUBLIC_BASE_URL_KEY))
    }

    @Test
    fun `invalid public base url leaves previous app settings unchanged`() {
        val harness = service(
            initialSettings = listOf(
                AppSetting(AppSettingsService.REGISTRATION_ENABLED_KEY, "true"),
                AppSetting(AppSettingsService.PUBLIC_BASE_URL_KEY, "https://current.example.com"),
            )
        )

        assertFailsWith<InvalidAppSettingsException> {
            harness.service.saveAppSettings(
                AppSettingsUpdate(
                    registrationEnabled = false,
                    publicBaseUrl = "https://invalid.example.com/",
                )
            )
        }

        assertEquals("true", harness.value(AppSettingsService.REGISTRATION_ENABLED_KEY))
        assertEquals("https://current.example.com", harness.value(AppSettingsService.PUBLIC_BASE_URL_KEY))
    }

    @Test
    fun `public base url validation rejects missing protocol`() {
        assertEquals(false, AppSettingsService.validPublicBaseUrl("todo.example.com"))
        assertEquals(false, AppSettingsService.validPublicBaseUrl("https://todo.example.com/"))
        assertEquals(true, AppSettingsService.validPublicBaseUrl("https://todo.example.com"))
    }

    private data class Harness(
        val service: AppSettingsService,
        val settings: MutableMap<String, AppSetting>,
    ) {
        fun value(key: String): String? = settings[key]?.value
    }

    private fun service(
        initialSettings: List<AppSetting> = emptyList(),
        defaultRegistrationEnabled: Boolean = true,
        defaultPublicBaseUrl: String = "http://localhost:5173",
    ): Harness {
        val settings = initialSettings.associateBy { it.key }.toMutableMap()
        val repository = Mockito.mock(AppSettingRepository::class.java)
        Mockito.`when`(repository.findById(ArgumentMatchers.anyString())).thenAnswer { invocation ->
            Optional.ofNullable(settings[invocation.arguments[0] as String])
        }
        Mockito.`when`(repository.save(ArgumentMatchers.any(AppSetting::class.java))).thenAnswer { invocation ->
            val setting = invocation.arguments[0] as AppSetting
            settings[setting.key] = setting
            setting
        }

        return Harness(
            AppSettingsService(repository, AppProperties(defaultPublicBaseUrl), defaultRegistrationEnabled),
            settings,
        )
    }
}
