package com.github.matthiasbalke.todo.auth

import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/users/me/verification")
class EmailVerificationController(
    private val emailVerificationService: EmailVerificationService,
) {

    @ExceptionHandler(EmailVerificationException::class)
    fun verificationError(error: EmailVerificationException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(error.status).body(ErrorResponse(error.code, error.message ?: "Email verification failed"))

    @GetMapping
    fun state(@AuthenticationPrincipal userId: UUID): EmailVerificationStateDto =
        emailVerificationService.state(userId)

    @PostMapping("/email")
    fun requestEmail(@AuthenticationPrincipal userId: UUID): VerificationEmailRequestResponse =
        emailVerificationService.requestVerificationEmail(userId)

    @PostMapping
    fun submitToken(
        @AuthenticationPrincipal userId: UUID,
        @RequestBody body: VerificationSubmitRequest,
    ): VerificationSubmitResponse =
        emailVerificationService.submitToken(userId, body.validationToken)

    @DeleteMapping("/pending-email")
    fun cancelPendingEmail(@AuthenticationPrincipal userId: UUID): EmailVerificationStateDto =
        emailVerificationService.cancelPendingEmail(userId)
}
