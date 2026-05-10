package nexus.database.tables

import org.jetbrains.exposed.v1.core.Table

object DamagePoliciesTable : Table("damage_policies")  {
    val id = varchar("id", 50)
    val name = varchar("name", 255).uniqueIndex()
    val description = text("description").nullable()

    override val primaryKey = PrimaryKey(id)
}