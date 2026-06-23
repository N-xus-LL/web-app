package nexus.database.tables

import org.jetbrains.exposed.v1.core.Table

object ItemConditionsTable : Table("item_conditions")  {
    val id = varchar("id", 50)
    val name = varchar("name", 255).uniqueIndex()

    override val primaryKey = PrimaryKey(DamagePoliciesTable.id)
}