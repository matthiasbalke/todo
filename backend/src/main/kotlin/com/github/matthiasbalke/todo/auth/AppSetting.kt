package com.github.matthiasbalke.todo.auth

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "app_settings")
class AppSetting(
    @Id
    @Column(name = "setting_key", nullable = false)
    val key: String,

    @Column(name = "setting_value", nullable = false)
    var value: String,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
