package com.github.matthiasbalke.todo.sse

import org.springframework.http.MediaType
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicLong

private const val BUFFER_CAPACITY = 100

data class BufferedEvent(
    val id: Long,
    val listId: UUID,
    val type: String,
    val payload: Any,
)

@Service
class SsePublisher {

    private val emitters = ConcurrentHashMap<UUID, CopyOnWriteArrayList<SseEmitter>>()
    private val buffer = ConcurrentHashMap<UUID, ArrayDeque<BufferedEvent>>()
    private val sequence = AtomicLong(0)

    fun subscribe(listId: UUID, lastEventId: Long?): SseEmitter {
        val emitter = SseEmitter(0L)
        emitters.computeIfAbsent(listId) { CopyOnWriteArrayList() }.add(emitter)

        // Flush headers immediately so the client knows the connection is established
        try {
            emitter.send(SseEmitter.event().comment("connected"))
        } catch (_: Exception) {
            emitters[listId]?.remove(emitter)
            return emitter
        }

        if (lastEventId != null) {
            buffer[listId]?.filter { it.id > lastEventId }?.forEach { event ->
                trySend(emitter, event)
            }
        }

        val cleanup = Runnable { emitters[listId]?.remove(emitter) }
        emitter.onCompletion(cleanup)
        emitter.onTimeout(cleanup)
        emitter.onError { cleanup.run() }

        return emitter
    }

    @Scheduled(fixedDelayString = "\${sse.heartbeat.interval-ms:25000}")
    fun sendHeartbeats() {
        emitters.values.forEach { list ->
            list.forEach { emitter ->
                try { emitter.send(SseEmitter.event().comment("ping")) }
                catch (_: Exception) { /* stale emitters cleaned up by error handler */ }
            }
        }
    }

    fun publish(event: ListEvent) {
        val buffered = BufferedEvent(
            id = sequence.incrementAndGet(),
            listId = event.listId,
            type = event.eventType(),
            payload = event.payload(),
        )

        buffer.computeIfAbsent(event.listId) { ArrayDeque() }.also { deque ->
            synchronized(deque) {
                deque.addLast(buffered)
                while (deque.size > BUFFER_CAPACITY) deque.removeFirst()
            }
        }

        val stale = mutableListOf<SseEmitter>()
        emitters[event.listId]?.forEach { emitter ->
            if (!trySend(emitter, buffered)) stale.add(emitter)
        }
        emitters[event.listId]?.removeAll(stale.toSet())
    }

    private fun trySend(emitter: SseEmitter, event: BufferedEvent): Boolean {
        return try {
            emitter.send(
                SseEmitter.event()
                    .id(event.id.toString())
                    .name(event.type)
                    .data(event.payload, MediaType.APPLICATION_JSON),
            )
            true
        } catch (_: Exception) {
            false
        }
    }
}
