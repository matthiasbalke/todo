package com.github.matthiasbalke.todo.items

import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.Repository
import org.springframework.data.repository.query.Param
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

interface TodayItemProjection {
    val id: UUID
    val listId: UUID
    val categoryId: UUID?
    val title: String
    val notes: String?
    val done: Boolean
    val starred: Boolean
    val dueDate: LocalDate?
    val recurrenceIntervalUnit: String?
    val recurrenceIntervalValue: Int?
    val parentItemId: UUID?
    val createdByUserId: UUID?
    val sortOrder: Int
    val createdAt: Instant
    val updatedAt: Instant
    val sourceListName: String
    val sourceListEmoji: String?
    val sourceListRole: String
    val sourceListGroupOrder: Int?
    val sourceListOrder: Int?
    val sourceCategoryName: String?
    val sourceCategoryColor: String?
    val sourceCategoryOrder: Int?
}

interface TodayRepository : Repository<TodoItem, UUID> {
    @Query(
        value = """
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
                   i.parent_item_id AS "parentItemId",
                   i.created_by_user_id AS "createdByUserId",
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
              FROM item_assignments ia
              JOIN todo_items i ON i.id = ia.item_id
              JOIN list_memberships m ON m.list_id = i.list_id AND m.user_id = ia.user_id
              JOIN lists l ON l.id = i.list_id
              LEFT JOIN categories c ON c.id = i.category_id
              LEFT JOIN list_group_assignments a ON a.list_id = i.list_id AND a.user_id = ia.user_id
              LEFT JOIN list_groups g ON g.id = a.group_id AND g.user_id = ia.user_id
             WHERE ia.user_id = :userId
               AND i.due_date <= :today
             ORDER BY g.sort_order NULLS LAST, a.sort_order NULLS LAST, l.name, c.sort_order NULLS LAST, i.sort_order, i.created_at
        """,
        nativeQuery = true,
    )
    fun findTodayItems(@Param("userId") userId: UUID, @Param("today") today: LocalDate): List<TodayItemProjection>

    @Query(
        value = """
            SELECT COUNT(*)
              FROM item_assignments ia
              JOIN todo_items i ON i.id = ia.item_id
              JOIN list_memberships m ON m.list_id = i.list_id AND m.user_id = ia.user_id
             WHERE ia.user_id = :userId
               AND i.due_date <= :today
               AND i.done = FALSE
        """,
        nativeQuery = true,
    )
    fun countUnfinishedTodayItems(@Param("userId") userId: UUID, @Param("today") today: LocalDate): Long
}
