package com.github.matthiasbalke.todo.items

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty

enum class IntervalUnit { DAYS, WEEKS, MONTHS, YEARS }

data class RecurrenceRule @JsonCreator constructor(
    @JsonProperty("intervalUnit") val intervalUnit: IntervalUnit,
    @JsonProperty("intervalValue") val intervalValue: Int,
)
