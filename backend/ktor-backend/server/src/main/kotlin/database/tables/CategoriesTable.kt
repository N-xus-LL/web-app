package nexus.database.tables

import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable

object CategoriesTable: UUIDTable("categories") {
    val name = varchar("name", 255).uniqueIndex()
    val description = text("description").nullable()
    val metadata = text("metadata").default("{}")
}