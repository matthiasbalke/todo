package com.github.matthiasbalke.todo.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.webauthn.api.PublicKeyCredentialCreationOptions
import org.springframework.security.web.webauthn.registration.PublicKeyCredentialCreationOptionsRepository
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

@Component
class InMemoryCredentialCreationOptionsRepository : PublicKeyCredentialCreationOptionsRepository {

    private data class Entry(
        val options: PublicKeyCredentialCreationOptions,
        val expiresAt: Instant = Instant.now().plusSeconds(300), // 5-minute TTL
    )

    private val store = ConcurrentHashMap<UUID, Entry>()

    override fun save(
        request: HttpServletRequest,
        response: HttpServletResponse,
        options: PublicKeyCredentialCreationOptions?,
    ) {
        val userId = currentUserId() ?: return
        options ?: return
        store[userId] = Entry(options)
    }

    override fun load(request: HttpServletRequest): PublicKeyCredentialCreationOptions? {
        val userId = currentUserId() ?: return null
        val entry = store.remove(userId) ?: return null // one-time use
        if (entry.expiresAt.isBefore(Instant.now())) return null
        return entry.options
    }

    private fun currentUserId(): UUID? =
        SecurityContextHolder.getContext().authentication?.principal as? UUID
}
