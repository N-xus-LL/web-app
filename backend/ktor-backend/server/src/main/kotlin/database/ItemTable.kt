package nexus.database

import org.jetbrains.exposed.v1.core.Table

object Items : Table("items") {
    val id = integer("id").autoIncrement()
    val title = varchar("title", 100)
    val price = varchar("price", 20)
    val location = varchar("location", 100)
    val link = varchar("link", 100)

    override val primaryKey = PrimaryKey(id)
}