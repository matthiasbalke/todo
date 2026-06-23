package com.github.matthiasbalke.todo.auth

data class AuthUserDto(
    val id: String,
    val email: String,
    val displayName: String,
    val admin: Boolean,
)

data class TokenResponse(
    val accessToken: String,
    val user: AuthUserDto,
)

data class ErrorResponse(
    val code: String,
    val message: String,
)
