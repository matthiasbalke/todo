package com.github.matthiasbalke.todo.auth

import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.webauthn.api.PublicKeyCredentialCreationOptions
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class InMemoryCredentialCreationOptionsRepositoryTest {

    private val repo = InMemoryCredentialCreationOptionsRepository()
    private val userId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        val auth = UsernamePasswordAuthenticationToken.authenticated(userId, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth
    }

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `load without prior save returns null`() {
        assertNull(repo.load(MockHttpServletRequest()))
    }

    @Test
    fun `load is one-time use - second load returns null`() {
        val options = mock(PublicKeyCredentialCreationOptions::class.java)
        repo.save(MockHttpServletRequest(), MockHttpServletResponse(), options)

        assertNotNull(repo.load(MockHttpServletRequest()))
        assertNull(repo.load(MockHttpServletRequest()))
    }

    @Test
    fun `load after TTL expires returns null`() {
        val options = mock(PublicKeyCredentialCreationOptions::class.java)
        repo.save(MockHttpServletRequest(), MockHttpServletResponse(), options)

        // Overwrite the stored entry with an expired one via reflection
        val storeField = InMemoryCredentialCreationOptionsRepository::class.java
            .getDeclaredField("store")
        storeField.isAccessible = true
        @Suppress("UNCHECKED_CAST")
        val store = storeField.get(repo) as ConcurrentHashMap<UUID, Any>

        val entryClass = InMemoryCredentialCreationOptionsRepository::class.java.declaredClasses
            .first { it.simpleName == "Entry" }
        // Use the two-parameter primary constructor (options, expiresAt)
        val ctor = entryClass.getDeclaredConstructors().first { it.parameterCount == 2 }
        ctor.isAccessible = true

        store[userId] = ctor.newInstance(options, Instant.now().minusSeconds(1))

        assertNull(repo.load(MockHttpServletRequest()))
    }
}
