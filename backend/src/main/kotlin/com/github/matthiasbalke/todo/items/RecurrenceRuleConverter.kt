package com.github.matthiasbalke.todo.items

import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter
import tools.jackson.databind.json.JsonMapper

@Converter
class RecurrenceRuleConverter : AttributeConverter<RecurrenceRule?, String?> {

    private val mapper = JsonMapper()

    override fun convertToDatabaseColumn(attribute: RecurrenceRule?): String? =
        attribute?.let { mapper.writeValueAsString(it) }

    override fun convertToEntityAttribute(dbData: String?): RecurrenceRule? =
        dbData?.let { mapper.readValue(it, RecurrenceRule::class.java) }
}
