package com.github.matthiasbalke.todo.push

import nl.martijndwars.webpush.Notification
import nl.martijndwars.webpush.PushService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class PushDispatchService(
    private val pushSubscriptionRepository: PushSubscriptionRepository,
    private val pushService: PushService,
) {
    private val logger = LoggerFactory.getLogger(PushDispatchService::class.java)

    @Transactional
    fun send(userId: UUID, title: String, body: String, url: String) {
        val subscriptions = pushSubscriptionRepository.findAllByUserId(userId)
        for (subscription in subscriptions) {
            try {
                val payload = """{"title":${escapeJson(title)},"body":${escapeJson(body)},"url":${escapeJson(url)}}"""
                val notification = Notification(
                    subscription.endpoint,
                    subscription.p256dh,
                    subscription.auth,
                    payload.toByteArray(Charsets.UTF_8),
                )
                val response = pushService.send(notification)
                val statusCode = response.statusLine.statusCode
                if (statusCode == 410 || statusCode == 404) {
                    pushSubscriptionRepository.deleteByUserIdAndEndpoint(userId, subscription.endpoint)
                    logger.info("Removed expired push subscription for user {}", userId)
                }
            } catch (e: Exception) {
                logger.warn("Failed to send push notification to user {}: {}", userId, e.message)
            }
        }
    }

    private fun escapeJson(value: String): String =
        "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""
}
