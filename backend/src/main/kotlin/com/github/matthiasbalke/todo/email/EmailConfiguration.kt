package com.github.matthiasbalke.todo.email

import java.net.URI

enum class EmailConfigurationSource {
    DEPLOYMENT,
    RUNTIME,
}

enum class EmailEncryption {
    STARTTLS,
    SSL_TLS,
}

enum class PasswordAction {
    KEEP,
    REPLACE,
    CLEAR,
}

data class EmailSettingsUpdate(
    val enabled: Boolean,
    val authEnabled: Boolean,
    val host: String,
    val port: Int?,
    val protocol: String,
    val encryption: EmailEncryption,
    val username: String?,
    val passwordAction: PasswordAction,
    val password: String?,
    val from: String,
    val fromName: String?,
    val publicBaseUrl: String,
)

data class EmailConfiguration(
    val source: EmailConfigurationSource,
    val enabled: Boolean,
    val authEnabled: Boolean,
    val host: String,
    val port: Int?,
    val protocol: String,
    val encryption: EmailEncryption,
    val username: String?,
    val password: String?,
    val from: String,
    val fromName: String?,
    val publicBaseUrl: String,
) {
    val passwordConfigured: Boolean = !password.isNullOrBlank()
    val validForSending: Boolean = validationErrors().isEmpty()

    fun validationErrors(): List<String> {
        if (!enabled) return emptyList()

        val errors = mutableListOf<String>()
        if (host.isBlank()) errors += "SMTP host is required"
        if (port == null) {
            errors += "SMTP port is required"
        } else if (port !in 1..65535) {
            errors += "SMTP port must be between 1 and 65535"
        }
        if (protocol.isBlank()) {
            errors += "SMTP protocol is required"
        } else if (!protocol.equals("smtp", ignoreCase = true)) {
            errors += "SMTP protocol must be smtp"
        }
        if (from.isBlank()) errors += "Sender address is required"
        if (publicBaseUrl.isBlank()) {
            errors += "Public application base URL is required"
        } else if (!validPublicBaseUrl(publicBaseUrl)) {
            errors += "Public app URL must look like https://todo.example.com without a trailing slash"
        }
        if (authEnabled) {
            if (username.isNullOrBlank()) errors += "SMTP username is required when authentication is enabled"
            if (password.isNullOrBlank()) errors += "SMTP password is required when authentication is enabled"
        }
        return errors
    }

    companion object {
        fun validPublicBaseUrl(value: String): Boolean {
            if (value.endsWith("/")) return false
            val uri = runCatching { URI(value) }.getOrNull() ?: return false
            return uri.scheme in setOf("http", "https") && !uri.host.isNullOrBlank()
        }
    }
}
