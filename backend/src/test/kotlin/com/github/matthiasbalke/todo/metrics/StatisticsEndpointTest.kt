package com.github.matthiasbalke.todo.metrics

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.auth.User
import com.github.matthiasbalke.todo.auth.UserRepository
import com.github.matthiasbalke.todo.items.TodoItem
import com.github.matthiasbalke.todo.items.ItemRepository
import com.github.matthiasbalke.todo.lists.Category
import com.github.matthiasbalke.todo.lists.CategoryRepository
import com.github.matthiasbalke.todo.lists.ListRepository
import com.github.matthiasbalke.todo.lists.List as TodoList
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import java.util.UUID

@AutoConfigureMockMvc
class StatisticsEndpointTest : AbstractIntegrationTest() {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var listRepository: ListRepository

    @Autowired
    private lateinit var itemRepository: ItemRepository

    @Autowired
    private lateinit var categoryRepository: CategoryRepository

    @Test
    fun `GET actuator-statistics - returns correct metrics`() {
        // Setup data
        val user = userRepository.save(User(email = "test@example.com", displayName = "Test User"))
        val list = listRepository.save(TodoList(name = "Test List"))
        
        categoryRepository.save(Category(listId = list.id, name = "Test Category"))
        
        itemRepository.save(TodoItem(listId = list.id, title = "Open Item", done = false, createdByUserId = user.id))
        itemRepository.save(TodoItem(listId = list.id, title = "Closed Item", done = true, createdByUserId = user.id))

        mockMvc.get("/actuator/statistics")
            .andExpect {
                status { isOk() }
                jsonPath("$.users.total") { value(1) }
                jsonPath("$.lists.total") { value(1) }
                jsonPath("$.lists.per_user.mean") { value(1.0) }
                jsonPath("$.lists.users_per_list.mean") { value(0.0) } // No membership created in test yet
                jsonPath("$.items.total") { value(2) }
                jsonPath("$.items.open") { value(1) }
                jsonPath("$.items.closed") { value(1) }
                jsonPath("$.items.per_list.mean") { value(2.0) }
                jsonPath("$.categories.total") { value(1) }
                jsonPath("$.categories.per_list.mean") { value(1.0) }
            }
    }
}
