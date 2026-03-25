package com.github.matthiasbalke.todo

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import javax.sql.DataSource

class MigrationSmokeTest : AbstractIntegrationTest() {

    @Autowired
    private lateinit var dataSource: DataSource

    @Test
    fun `migrations run and database is reachable`() {
        dataSource.connection.use { conn ->
            conn.createStatement().use { stmt ->
                stmt.execute("SELECT 1")
            }
        }
    }
}
