package com.github.matthiasbalke.todo.auth

import org.springframework.stereotype.Service
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

sealed interface AppRoute {
    data class Recovery(val token: String) : AppRoute
}

@Service
class ApplicationLinkService(
    private val appSettingsService: AppSettingsService,
) {

    fun url(route: AppRoute): String {
        val base = appSettingsService.publicBaseUrl().trimEnd('/')
        return "$base${path(route)}"
    }

    private fun path(route: AppRoute): String = when (route) {
        is AppRoute.Recovery -> "/recover/${encodePathSegment(route.token)}"
    }

    private fun encodePathSegment(value: String): String =
        URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20")
}
