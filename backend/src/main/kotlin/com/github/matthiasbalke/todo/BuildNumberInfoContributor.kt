package com.github.matthiasbalke.todo

import org.springframework.boot.actuate.info.Info
import org.springframework.boot.actuate.info.InfoContributor
import org.springframework.stereotype.Component

@Component
class BuildNumberInfoContributor : InfoContributor {
    override fun contribute(builder: Info.Builder) {
        builder.withDetail("build-number", System.getenv("APP_BUILD_NUMBER") ?: "0")
    }
}
