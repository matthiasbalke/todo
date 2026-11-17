package com.github.matthiasbalke.todo.items

import jakarta.persistence.Column
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Embeddable
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.io.Serializable
import java.util.UUID

@Embeddable
data class AgileSelectionId(
    @Column(name = "user_id") val userId: UUID = UUID.randomUUID(),
    @Column(name = "item_id") val itemId: UUID = UUID.randomUUID(),
) : Serializable

@Entity
@Table(name = "agile_item_selections")
class AgileSelection(
    @EmbeddedId val id: AgileSelectionId = AgileSelectionId(),
    var position: Long = 0,
)

interface AgileRepository : JpaRepository<AgileSelection, AgileSelectionId> {
    fun findAllByIdUserIdOrderByPositionAscIdItemIdAsc(userId: UUID): List<AgileSelection>

    @Query(value = """
            SELECT i.id,
                   i.list_id AS "listId",
                   i.category_id AS "categoryId",
                   i.title,
                   i.notes,
                   i.done,
                   i.starred,
                   i.due_date AS "dueDate",
                   i.recurrence_rule ->> 'intervalUnit' AS "recurrenceIntervalUnit",
                   CAST(i.recurrence_rule ->> 'intervalValue' AS integer) AS "recurrenceIntervalValue",
                   ARRAY_TO_STRING(ARRAY(SELECT jsonb_array_elements_text(NULLIF(i.recurrence_rule -> 'weekdays', 'null'::jsonb))), ',') AS "recurrenceWeekdays",
                   i.parent_item_id AS "parentItemId",
                   i.created_by_user_id AS "createdByUserId",
                   i.updated_by_user_id AS "updatedByUserId",
                   i.sort_order AS "sortOrder",
                   i.created_at AS "createdAt",
                   i.updated_at AS "updatedAt",
                   l.name AS "sourceListName",
                   l.emoji AS "sourceListEmoji",
                   m.role AS "sourceListRole",
                   g.sort_order AS "sourceListGroupOrder",
                   a.sort_order AS "sourceListOrder",
                   c.name AS "sourceCategoryName",
                   c.color AS "sourceCategoryColor",
                   c.sort_order AS "sourceCategoryOrder"
              FROM agile_item_selections s
              JOIN todo_items i ON i.id = s.item_id
              JOIN list_memberships m ON m.list_id = i.list_id AND m.user_id = s.user_id
              JOIN lists l ON l.id = i.list_id
              LEFT JOIN categories c ON c.id = i.category_id
              LEFT JOIN list_group_assignments a ON a.list_id = i.list_id AND a.user_id = s.user_id
              LEFT JOIN list_groups g ON g.id = a.group_id AND g.user_id = s.user_id
             WHERE s.user_id = :userId
             ORDER BY s.position, i.id
    """, nativeQuery = true)
    fun findEntries(userId: UUID): List<TodayItemProjection>

    @Query(value = """
        SELECT count(*) FROM agile_item_selections s
        JOIN todo_items i ON i.id = s.item_id
        JOIN list_memberships m ON m.list_id = i.list_id AND m.user_id = s.user_id
        WHERE s.user_id = :userId AND NOT i.done
    """, nativeQuery = true)
    fun countUnfinished(userId: UUID): Long
}
