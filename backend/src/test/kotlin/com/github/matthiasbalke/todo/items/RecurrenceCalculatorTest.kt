package com.github.matthiasbalke.todo.items

import java.time.DayOfWeek
import java.time.LocalDate
import org.junit.jupiter.api.Test
import org.springframework.web.server.ResponseStatusException
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class RecurrenceCalculatorTest {
    @Test
    fun `weekday calendar advances through active weeks and boundaries`() {
        data class Case(val base: String, val weeks: Int, val days: List<DayOfWeek>, val expected: String)
        val monThu = listOf(DayOfWeek.THURSDAY, DayOfWeek.MONDAY)
        listOf(
            Case("2026-11-02", 2, monThu, "2026-11-05"),
            Case("2026-11-05", 2, monThu, "2026-11-16"),
            Case("2026-11-03", 1, monThu, "2026-11-05"),
            Case("2026-12-31", 1, listOf(DayOfWeek.THURSDAY), "2027-01-07"),
            Case("2026-11-08", 1, listOf(DayOfWeek.MONDAY, DayOfWeek.SUNDAY), "2026-11-09"),
            Case("2026-11-02", 1, listOf(DayOfWeek.SUNDAY), "2026-11-08"),
        ).forEach { case ->
            assertEquals(LocalDate.parse(case.expected), RecurrenceCalculator.nextDate(
                LocalDate.parse(case.base), RecurrenceRule(IntervalUnit.WEEKS, case.weeks, case.days)
            ), case.toString())
        }
    }

    @Test
    fun `interval calculation clamps month and year ends and retains old custom intervals`() {
        listOf(
            Triple("2027-01-31", RecurrenceRule(IntervalUnit.MONTHS, 1), "2027-02-28"),
            Triple("2024-02-29", RecurrenceRule(IntervalUnit.YEARS, 1), "2025-02-28"),
            Triple("2026-11-02", RecurrenceRule(IntervalUnit.WEEKS, 2), "2026-11-16"),
            Triple("2026-11-13", RecurrenceRule(IntervalUnit.DAYS, 1), "2026-11-14"),
        ).forEach { (base, rule, expected) ->
            assertEquals(LocalDate.parse(expected), RecurrenceCalculator.nextDate(LocalDate.parse(base), rule))
        }
        assertFailsWith<ResponseStatusException> {
            RecurrenceCalculator.nextDate(LocalDate.of(2026, 1, 1), RecurrenceRule(IntervalUnit.YEARS, Int.MAX_VALUE))
        }
    }
}
