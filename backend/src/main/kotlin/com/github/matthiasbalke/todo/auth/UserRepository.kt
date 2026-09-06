package com.github.matthiasbalke.todo.auth

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface UserRepository : JpaRepository<User, UUID> {
    @Query("SELECT u FROM User u WHERE lower(trim(u.email)) = lower(trim(:email))")
    fun findByEmailIdentity(@Param("email") email: String): User?

    @Query(
        """
        SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END
        FROM User u
        WHERE lower(trim(u.email)) = lower(trim(:email))
          AND u.id <> :id
        """
    )
    fun existsByEmailIdentityAndIdNot(@Param("email") email: String, @Param("id") id: UUID): Boolean

    fun countByAdminTrue(): Long
    fun countByBlockedAtIsNotNull(): Long
    fun countByAdminTrueAndBlockedAtIsNull(): Long

    @Query("SELECT u FROM User u ORDER BY lower(u.email)")
    fun findAllOrderedByEmail(): List<User>
}
