package com.github.matthiasbalke.todo.items

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface AssignedUserProjection {
    val id: UUID
    val displayName: String
}

interface ItemAssignmentRepository : JpaRepository<ItemAssignment, ItemAssignmentId> {
    fun findAllByIdItemId(itemId: UUID): List<ItemAssignment>
    fun findAllByIdItemIdIn(itemIds: Collection<UUID>): List<ItemAssignment>
    fun deleteAllByIdItemId(itemId: UUID)

    @Query(
        value = """
            SELECT u.id, u.display_name AS "displayName"
              FROM item_assignments ia
              JOIN users u ON u.id = ia.user_id
             WHERE ia.item_id = :itemId
             ORDER BY u.display_name
        """,
        nativeQuery = true,
    )
    fun findAssignedUsers(@Param("itemId") itemId: UUID): List<AssignedUserProjection>
}
