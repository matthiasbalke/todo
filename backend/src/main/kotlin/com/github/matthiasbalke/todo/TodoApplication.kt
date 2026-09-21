package com.github.matthiasbalke.todo

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.mail.autoconfigure.MailProperties
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling
import com.github.matthiasbalke.todo.auth.JwtProperties
import com.github.matthiasbalke.todo.email.EmailProperties

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(JwtProperties::class, EmailProperties::class, MailProperties::class)
class TodoApplication

fun main(args: Array<String>) {
	runApplication<TodoApplication>(*args)
}
