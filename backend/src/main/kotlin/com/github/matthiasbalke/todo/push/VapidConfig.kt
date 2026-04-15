package com.github.matthiasbalke.todo.push

import nl.martijndwars.webpush.PushService
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling
import java.security.Security

@Configuration
@EnableScheduling
class VapidConfig {

    @Bean
    fun pushService(
        @Value("\${vapid.public-key}") publicKey: String,
        @Value("\${vapid.private-key}") privateKey: String,
        @Value("\${vapid.subject}") subject: String,
    ): PushService {
        if (Security.getProvider("BC") == null) {
            Security.addProvider(BouncyCastleProvider())
        }
        return PushService(publicKey, privateKey, subject)
    }
}
