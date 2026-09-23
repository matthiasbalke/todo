package com.github.matthiasbalke.todo.auth

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app")
data class AppProperties(
    val publicBaseUrl: String = "http://localhost:5173",
)
