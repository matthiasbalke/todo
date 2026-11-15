package com.github.matthiasbalke.todo.items

import java.time.DateTimeException
import java.time.LocalDate
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException

object RecurrenceCalculator {
    fun nextDate(base: LocalDate, rule: RecurrenceRule): LocalDate {
        val valid = rule.validated()
        try {
            val next = calculate(base, valid)
            // PostgreSQL DATE has a smaller range than Java LocalDate.
            // https://www.postgresql.org/docs/current/datatype-datetime.html
            if (next.year > 5874897) throw DateTimeException("Date exceeds PostgreSQL DATE range")
            return next
        } catch (ex: DateTimeException) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Next recurrence date is outside the supported calendar", ex)
        } catch (ex: ArithmeticException) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Next recurrence date is outside the supported calendar", ex)
        }
    }
    private fun calculate(base: LocalDate, rule: RecurrenceRule): LocalDate {
        val days = rule.weekdays
        if (days != null) {
            // Inspect at most seven days; only active weeks produce occurrences.
            val later = days.firstOrNull { it.value > base.dayOfWeek.value }
            if (later != null) return base.plusDays((later.value - base.dayOfWeek.value).toLong())
            return base.plusWeeks(rule.intervalValue.toLong())
                .plusDays((days.first().value - base.dayOfWeek.value).toLong())
        }
        return when (rule.intervalUnit) {
            IntervalUnit.DAYS -> base.plusDays(rule.intervalValue.toLong())
            IntervalUnit.WEEKS -> base.plusWeeks(rule.intervalValue.toLong())
            IntervalUnit.MONTHS -> base.plusMonths(rule.intervalValue.toLong())
            IntervalUnit.YEARS -> base.plusYears(rule.intervalValue.toLong())
        }
    }
}
