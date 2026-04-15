package com.github.matthiasbalke.todo.push

import com.github.matthiasbalke.todo.items.ItemAssignmentRepository
import com.github.matthiasbalke.todo.items.ItemRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDate

@Component
class PushScheduler(
    private val itemRepository: ItemRepository,
    private val itemAssignmentRepository: ItemAssignmentRepository,
    private val pushDispatchService: PushDispatchService,
) {
    private val logger = LoggerFactory.getLogger(PushScheduler::class.java)

    @Scheduled(cron = "\${push.schedule.daily-cron:0 0 8 * * *}")
    fun sendDailyReminders() {
        val today = LocalDate.now()

        val dueToday = itemRepository.findByDueDateAndDoneFalse(today)
        for (item in dueToday) {
            val assignees = itemAssignmentRepository.findAllByIdItemId(item.id).map { it.id.userId }
            for (userId in assignees) {
                pushDispatchService.send(userId, "Task due today", item.title, "/lists/${item.listId}")
            }
        }

        val overdue = itemRepository.findByDueDateBeforeAndDoneFalse(today)
        for (item in overdue) {
            val assignees = itemAssignmentRepository.findAllByIdItemId(item.id).map { it.id.userId }
            for (userId in assignees) {
                pushDispatchService.send(userId, "Overdue task", item.title, "/lists/${item.listId}")
            }
        }

        logger.debug("Daily push reminders sent: {} due today, {} overdue", dueToday.size, overdue.size)
    }
}
