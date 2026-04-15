package com.github.matthiasbalke.todo.push

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

data class SubscribeRequest(
    val endpoint: String,
    val p256dh: String,
    val auth: String,
)

data class UnsubscribeRequest(
    val endpoint: String,
)

data class VapidPublicKeyResponse(
    val publicKey: String,
)

@RestController
@RequestMapping("/api/push")
class PushController(
    private val pushSubscriptionRepository: PushSubscriptionRepository,
    @Value("\${vapid.public-key}") private val vapidPublicKey: String,
) {

    @GetMapping("/vapid-public-key")
    fun getVapidPublicKey(): VapidPublicKeyResponse =
        VapidPublicKeyResponse(vapidPublicKey)

    @PostMapping("/subscribe")
    @ResponseStatus(HttpStatus.CREATED)
    fun subscribe(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody req: SubscribeRequest,
    ) {
        if (!pushSubscriptionRepository.existsByUserIdAndEndpoint(userId, req.endpoint)) {
            pushSubscriptionRepository.save(
                PushSubscription(
                    userId = userId,
                    endpoint = req.endpoint,
                    p256dh = req.p256dh,
                    auth = req.auth,
                )
            )
        }
    }

    @DeleteMapping("/subscribe")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun unsubscribe(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody req: UnsubscribeRequest,
    ) {
        pushSubscriptionRepository.deleteByUserIdAndEndpoint(userId, req.endpoint)
    }
}
