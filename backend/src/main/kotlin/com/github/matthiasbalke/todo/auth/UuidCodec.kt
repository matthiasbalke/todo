package com.github.matthiasbalke.todo.auth

import java.nio.ByteBuffer
import java.util.UUID

internal fun bytesToUuid(bytes: ByteArray): UUID? {
    if (bytes.size != 16) return null
    val buffer = ByteBuffer.wrap(bytes)
    return UUID(buffer.long, buffer.long)
}

internal fun uuidToBytes(uuid: UUID): ByteArray {
    val buffer = ByteBuffer.allocate(16)
    buffer.putLong(uuid.mostSignificantBits)
    buffer.putLong(uuid.leastSignificantBits)
    return buffer.array()
}
