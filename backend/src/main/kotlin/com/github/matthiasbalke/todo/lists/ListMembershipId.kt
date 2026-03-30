package com.github.matthiasbalke.todo.lists

import java.io.Serializable
import java.util.UUID

data class ListMembershipId(
    val listId: UUID = UUID.randomUUID(),
    val userId: UUID = UUID.randomUUID(),
) : Serializable
