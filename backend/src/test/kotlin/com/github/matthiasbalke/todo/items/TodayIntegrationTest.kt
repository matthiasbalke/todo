package com.github.matthiasbalke.todo.items

import com.github.matthiasbalke.todo.AbstractIntegrationTest
import com.github.matthiasbalke.todo.auth.JwtTokenService
import com.github.matthiasbalke.todo.auth.User
import com.github.matthiasbalke.todo.auth.UserRepository
import com.github.matthiasbalke.todo.lists.ListMembership
import com.github.matthiasbalke.todo.lists.ListMembershipRepository
import com.github.matthiasbalke.todo.lists.ListRepository
import com.github.matthiasbalke.todo.lists.ListRole
import com.github.matthiasbalke.todo.lists.List as TodoList
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

@AutoConfigureMockMvc
class TodayIntegrationTest : AbstractIntegrationTest() {
    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var listRepository: ListRepository
    @Autowired private lateinit var membershipRepository: ListMembershipRepository
    @Autowired private lateinit var itemRepository: ItemRepository
    @Autowired private lateinit var assignmentRepository: ItemAssignmentRepository
    @Autowired private lateinit var jwtTokenService: JwtTokenService

    private fun user(timeZone: String = "UTC") =
        userRepository.save(User(email = "${UUID.randomUUID()}@example.com", displayName = "Today User", timeZone = timeZone, timeZoneInitialized = true))

    private fun list(user: User, role: ListRole = ListRole.OWNER): TodoList =
        listRepository.save(TodoList(name = "Source")).also {
            membershipRepository.save(ListMembership(it.id, user.id, role))
        }

    private fun item(list: TodoList, user: User?, dueDate: LocalDate?, done: Boolean = false): TodoItem =
        itemRepository.save(TodoItem(listId = list.id, title = UUID.randomUUID().toString(), dueDate = dueDate, done = done)).also {
            if (user != null) assignmentRepository.save(ItemAssignment(ItemAssignmentId(it.id, user.id)))
        }

    private fun auth(user: User) = "Bearer ${jwtTokenService.generateAccessToken(user)}"

    @Test
    fun `Today includes due overdue completed and viewer items while excluding non-qualifying items`() {
        val user = user("Pacific/Kiritimati")
        val other = user()
        val today = LocalDate.now(ZoneId.of(user.timeZone))
        val editable = list(user)
        val viewer = list(user, ListRole.VIEWER)
        item(editable, user, today)
        item(editable, user, today.minusDays(1), done = true)
        item(viewer, user, today)
        item(editable, user, today.plusDays(1))
        item(editable, user, null)
        item(editable, null, today)
        item(editable, other, today)

        mockMvc.get("/api/today") { header("Authorization", auth(user)) }.andExpect {
            status { isOk() }
            jsonPath("$.length()") { value(3) }
            jsonPath("$[?(@.sourceListRole == 'VIEWER')]") { isNotEmpty() }
            jsonPath("$[?(@.done == true)]") { isNotEmpty() }
        }
        mockMvc.get("/api/today/count") { header("Authorization", auth(user)) }.andExpect {
            status { isOk() }
            jsonPath("$.count") { value(2) }
        }
    }

    @Test
    fun `Today item and unfinished count lose inaccessible list items consistently`() {
        val user = user()
        val source = list(user)
        item(source, user, LocalDate.now(ZoneId.of(user.timeZone)))
        membershipRepository.deleteById(com.github.matthiasbalke.todo.lists.ListMembershipId(source.id, user.id))

        mockMvc.get("/api/today") { header("Authorization", auth(user)) }.andExpect {
            status { isOk() }
            jsonPath("$.length()") { value(0) }
        }
        mockMvc.get("/api/today/count") { header("Authorization", auth(user)) }.andExpect {
            status { isOk() }
            jsonPath("$.count") { value(0) }
        }
    }
}
