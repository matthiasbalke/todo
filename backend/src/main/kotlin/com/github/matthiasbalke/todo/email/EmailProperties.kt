package com.github.matthiasbalke.todo.email

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.email")
data class EmailProperties(
    val enabled: Boolean = false,
    val auth: Auth = Auth(),
    val encryption: EmailEncryption = EmailEncryption.STARTTLS,
    val from: String = "",
    val fromName: String = "Todo",
    val publicBaseUrl: String = "http://localhost:5173",
) {
    data class Auth(
        val enabled: Boolean = false,
    )
}
