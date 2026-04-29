package com.github.matthiasbalke.todo.items

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.io.Serializable
import java.util.UUID

@Embeddable
data class ItemAssignmentId(
    @Column(name = "item_id") val itemId: UUID,
    @Column(name = "user_id") val userId: UUID,
) : Serializable

@Entity
@Table(name = "item_assignments")
class ItemAssignment(
    @EmbeddedId
    val id: ItemAssignmentId,
)
