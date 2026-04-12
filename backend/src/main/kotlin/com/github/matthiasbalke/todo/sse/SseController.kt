package com.github.matthiasbalke.todo.sse

import com.github.matthiasbalke.todo.lists.ListAccessService
import org.springframework.http.MediaType
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.UUID

@RestController
@RequestMapping("/api/lists/{listId}/events")
class SseController(
    private val ssePublisher: SsePublisher,
    private val listAccessService: ListAccessService,
) {

    @GetMapping(produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun subscribe(
        @AuthenticationPrincipal userId: UUID,
        @PathVariable listId: UUID,
        @RequestHeader(value = "Last-Event-ID", required = false) lastEventId: String?,
    ): SseEmitter {
        listAccessService.requireMembership(listId, userId)
        return ssePublisher.subscribe(listId, lastEventId?.toLongOrNull())
    }
}
