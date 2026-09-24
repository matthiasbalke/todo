package com.github.matthiasbalke.todo.auth

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

interface RefreshTokenRepository : JpaRepository<RefreshToken, UUID> {
    fun findByTokenHash(tokenHash: String): RefreshToken?
    fun deleteAllByUserId(userId: UUID)

    @Transactional
    @Modifying
    @Query("delete from RefreshToken token where token.id = :id")
    fun deleteByIdIfPresent(@Param("id") id: UUID): Int

    @Transactional
    @Modifying
    @Query("delete from RefreshToken token where token.tokenHash = :tokenHash")
    fun deleteByTokenHashIfPresent(@Param("tokenHash") tokenHash: String): Int
}
