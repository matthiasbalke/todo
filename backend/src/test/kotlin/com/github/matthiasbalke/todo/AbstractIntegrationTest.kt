package com.github.matthiasbalke.todo

import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import

@Import(TestcontainersConfiguration::class)
@SpringBootTest
abstract class AbstractIntegrationTest
