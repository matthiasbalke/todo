package com.github.matthiasbalke.todo.metrics

interface AggregationResult {
    val min: Long
    val max: Long
    val avg: Double
}
