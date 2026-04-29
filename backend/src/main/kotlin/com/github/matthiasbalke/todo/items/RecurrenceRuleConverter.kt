package com.github.matthiasbalke.todo.items

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

@Converter
class RecurrenceRuleConverter : AttributeConverter<RecurrenceRule?, String?> {

    private val mapper = ObjectMapper().apply {
        findAndRegisterModules()
    }

    override fun convertToDatabaseColumn(attribute: RecurrenceRule?): String? =
        attribute?.let { mapper.writeValueAsString(it) }

    override fun convertToEntityAttribute(dbData: String?): RecurrenceRule? =
        dbData?.let { mapper.readValue(it, RecurrenceRule::class.java) }
}
