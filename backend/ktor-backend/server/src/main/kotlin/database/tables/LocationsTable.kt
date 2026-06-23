@file:OptIn(ExperimentalUuidApi::class)

package nexus.database.tables

import org.jetbrains.exposed.v1.core.ColumnType
import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import kotlin.uuid.ExperimentalUuidApi

object LocationsTable : UUIDTable("locations") {
    val name = varchar("name", 255)
    val locationType = text("location_type").nullable()

    val location = registerColumn<Any>(
        "location",
        object : ColumnType<Any>() {
            override fun sqlType(): String = "GEOMETRY(Point, 4326)"
            override fun valueFromDB(value: Any): Any = value
            override fun notNullValueToDB(value: Any): Any = value
        }
    )

    val sourceColumn = text("source").default("manual")
    val metadata = text("metadata").default("{}")
}
