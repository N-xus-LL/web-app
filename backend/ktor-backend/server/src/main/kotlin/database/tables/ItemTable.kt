@file:OptIn(ExperimentalUuidApi::class)

package nexus.database.tables

import org.jetbrains.exposed.v1.core.ColumnType
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.javatime.CurrentTimestamp
import org.jetbrains.exposed.v1.javatime.timestamp
import kotlin.uuid.ExperimentalUuidApi
/*    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    condition_id TEXT REFERENCES item_conditions(id),
    default_damage_policy_id TEXT REFERENCES damage_policies(id),

    name TEXT NOT NULL,
    description TEXT,
    images TEXT[],

    current_location GEOMETRY(POINT, 4326) NOT NULL,
    available BOOLEAN DEFAULT true,

    weight DOUBLE PRECISION NOT NULL,   -- kg
    length DOUBLE PRECISION NOT NULL,   -- cm
    width  DOUBLE PRECISION NOT NULL,   -- cm
    height DOUBLE PRECISION NOT NULL,   -- cm

    estimated_value DECIMAL(10,2),

    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP*/
object ItemTable: UUIDTable("items") {
    val ownerId = reference("owner_id", Users, onDelete = ReferenceOption.CASCADE)
    val categoryId = reference("category_id", CategoriesTable, onDelete = ReferenceOption.SET_NULL).nullable()
    val conditionId = varchar("condition_id", 50).references(ItemConditionsTable.id).nullable()

    val defaultDamagePolicyId = varchar("default_damage_policy_id", 50).references(DamagePoliciesTable.id).nullable()

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
    val available = bool("available").default(true)

    val weight = double("weight")
    val length = double("length")
    val width = double("width")
    val height = double("height")

    val estimatedValue = decimal("estimated_value", 10, 2).nullable()

    // val metadata = jsonb("metadata")
    val metadata = text("metadata").default("{}")
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp)

    val updatedAt = timestamp("updated_at").defaultExpression(CurrentTimestamp)

}
