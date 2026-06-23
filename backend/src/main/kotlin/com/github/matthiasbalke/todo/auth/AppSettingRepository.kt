package com.github.matthiasbalke.todo.auth

import org.springframework.data.jpa.repository.JpaRepository

interface AppSettingRepository : JpaRepository<AppSetting, String>
