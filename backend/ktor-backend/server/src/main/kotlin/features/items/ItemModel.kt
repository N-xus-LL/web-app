package nexus.features.items

import nexus.features.users.Users
import nexus.features.items.data.*
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.json.jsonb
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import org.jetbrains.exposed.v1.core.ReferenceOption

import kotlin.uuid.Uuid
import kotlin.uuid.ExperimentalUuidApi
@OptIn(ExperimentalUuidApi::class)

object Items : Table("items") {
    val id = uuid("id").clientDefault { Uuid.random() }
    val ownerId = uuid("owner_id").references(Users.id, onDelete = ReferenceOption.CASCADE) //
    val categoryId = uuid("category_id").references(Categories.id, onDelete = ReferenceOption.SET_NULL).nullable() //

    val conditionId = text("condition_id").references(ItemConditions.id).nullable() //
    val defaultDamagePolicyId = text("default_damage_policy_id").references(DamagePolicies.id).nullable() //

    val name = text("name") //
    val description = text("description").nullable() //

    // Postgres images TEXT[] can be treated as a JSON list for simplicity in Exposed
    val images = jsonb<List<String>>(
        name = "images",
        serialize = { Json.encodeToString(it) },
        deserialize = { Json.decodeFromString(it) }
    ).nullable() //

    val available = bool("available").default(true) //
    val estimatedValue = decimal("estimated_value", 10, 2).nullable() //

    val metadata = jsonb<JsonElement>("metadata", Json.Default)

    override val primaryKey = PrimaryKey(id)
}