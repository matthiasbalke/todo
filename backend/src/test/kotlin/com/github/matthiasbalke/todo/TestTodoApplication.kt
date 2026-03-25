package com.github.matthiasbalke.todo

import org.springframework.boot.fromApplication
import org.springframework.boot.with


fun main(args: Array<String>) {
	fromApplication<TodoApplication>().with(TestcontainersConfiguration::class).run(*args)
}
