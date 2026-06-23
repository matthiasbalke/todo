package com.github.matthiasbalke.todo.metrics

import com.github.matthiasbalke.todo.auth.UserRepository
import com.github.matthiasbalke.todo.items.ItemRepository
import com.github.matthiasbalke.todo.lists.CategoryRepository
import com.github.matthiasbalke.todo.lists.ListMembershipRepository
import com.github.matthiasbalke.todo.lists.ListRepository
import org.springframework.boot.actuate.endpoint.annotation.Endpoint
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation
import org.springframework.stereotype.Component
import java.time.Duration
import java.time.Instant

@Component
@Endpoint(id = "statistics")
class StatisticsEndpoint(
    private val userRepository: UserRepository,
    private val listRepository: ListRepository,
    private val itemRepository: ItemRepository,
    private val categoryRepository: CategoryRepository,
    private val listMembershipRepository: ListMembershipRepository
) {

    @ReadOperation
    fun statistics(): Map<String, Any> {
        val now = Instant.now()
        val last24h = now.minus(Duration.ofDays(1))
        val last7d = now.minus(Duration.ofDays(7))

        val totalItems = itemRepository.count()
        val openItems = itemRepository.countByDone(false)
        val closedItems = itemRepository.countByDone(true)

        val listsPerUser = listMembershipRepository.getListsPerUserStats()
        val usersPerList = listMembershipRepository.getUsersPerListStats()
        val itemsPerList = itemRepository.getItemsPerListStats()
        val categoriesPerList = categoryRepository.getCategoriesPerListStats()

        return mapOf(
            "users" to mapOf(
                "total" to userRepository.count(),
                "delta_24h" to userRepository.countByCreatedAtAfter(last24h),
                "delta_7d" to userRepository.countByCreatedAtAfter(last7d)
            ),
            "lists" to mapOf(
                "total" to listRepository.count(),
                "delta_24h" to listRepository.countByCreatedAtAfter(last24h),
                "per_user" to mapOf(
                    "min" to listsPerUser.min,
                    "max" to listsPerUser.max,
                    "mean" to listsPerUser.avg
                ),
                "users_per_list" to mapOf(
                    "min" to usersPerList.min,
                    "max" to usersPerList.max,
                    "mean" to usersPerList.avg
                )
            ),
            "items" to mapOf(
                "total" to totalItems,
                "open" to openItems,
                "closed" to closedItems,
                "delta_24h" to itemRepository.countByCreatedAtAfter(last24h),
                "per_list" to mapOf(
                    "min" to itemsPerList.min,
                    "max" to itemsPerList.max,
                    "mean" to itemsPerList.avg
                )
            ),
            "categories" to mapOf(
                "total" to categoryRepository.count(),
                "delta_24h" to categoryRepository.countByCreatedAtAfter(last24h),
                "per_list" to mapOf(
                    "min" to categoriesPerList.min,
                    "max" to categoriesPerList.max,
                    "mean" to categoriesPerList.avg
                )
            )
        )
    }
}
