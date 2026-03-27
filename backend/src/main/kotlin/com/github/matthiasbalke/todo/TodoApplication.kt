package com.github.matthiasbalke.todo

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import com.github.matthiasbalke.todo.auth.JwtProperties

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties::class)
class TodoApplication

fun main(args: Array<String>) {
	runApplication<TodoApplication>(*args)
}
