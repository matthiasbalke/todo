package com.github.matthiasbalke.todo.items

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import java.time.DayOfWeek
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException

enum class IntervalUnit { DAYS, WEEKS, MONTHS, YEARS }

data class RecurrenceRule @JsonCreator constructor(
    @JsonProperty("intervalUnit") val intervalUnit: IntervalUnit,
    @JsonProperty("intervalValue") val intervalValue: Int,
    @JsonProperty("weekdays") val weekdays: List<DayOfWeek>? = null,
)

/** Validate before mutation and keep equivalent weekday sets in ISO order. */
fun RecurrenceRule.validated(): RecurrenceRule {
    if (intervalValue < 1 || weekdays?.let {
        intervalUnit != IntervalUnit.WEEKS || it.isEmpty() || it.distinct().size != it.size
    } == true) {
        throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid recurrence amount or weekdays")
    }
    return copy(weekdays = weekdays?.sorted())
}
