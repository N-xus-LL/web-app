@file:OptIn(ExperimentalUuidApi::class)

package nexus.database.tables

import org.jetbrains.exposed.v1.core.ColumnType
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.javatime.CurrentTimestamp
import org.jetbrains.exposed.v1.javatime.timestamp
import kotlin.uuid.ExperimentalUuidApi

object ItemTable: UUIDTable("items") {
    val owner_id = reference("owner_id", Users, onDelete = ReferenceOption.CASCADE)
    val category_id = reference("category_id", CategoriesTable, onDelete = ReferenceOption.SET_NULL).nullable()
    val condition_id = varchar("condition_id", 50).references(ItemConditionsTable.id).nullable()

    val default_damage_policy_id = varchar("default_damage_policy_id", 50).references(DamagePoliciesTable.id).nullable()

    val name = varchar("name", 255)
    val description = text("description").nullable()
    val images = array<String>("images")

    val currentLocation = registerColumn<Any>(
        "current_location",
        object : ColumnType<Any>() {

            override fun sqlType(): String = "GEOMETRY(Point, 4326)"

            override fun valueFromDB(value: Any): Any = value

            override fun notNullValueToDB(value: Any): Any = value
        }
    )

    val estimatedValue = decimal("estimated_value", 10, 2).nullable()
    val available = bool("available").default(true)

    // val metadata = jsonb("metadata")
    val metadata = text("metadata").default("{}")
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp)

    val updatedAt = timestamp("updated_at").defaultExpression(CurrentTimestamp)

}