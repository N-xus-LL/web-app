package nexus.database


import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import nexus.api.model.ItemResponse
import nexus.database.tables.ItemTable
import nexus.models.GeoPoint
import nexus.models.ItemRequest
import nexus.utils.formatGeoPoint
import nexus.utils.parseGeoPoint
import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.ResultRow
import java.time.Instant
import java.util.UUID
import java.sql.ResultSet


fun ResultSet.toItem(): ItemEntity {
    return ItemEntity(
        id =  UUID.fromString(getString("id")),
        owner_id = UUID.fromString(getString("owner_id")),

        category_id = getString("category_id")?.let(UUID::fromString),
        condition_id = getString("condition_id"),
        default_damage_policy_id = getString("default_damage_policy_id"),

        name = getString("name"),
        description = getString("description"),

        images = (getArray("images").array as Array<String>).toList(),

        currentLocation = GeoPoint(
            longitude = getDouble("lon"),
            latitude = getDouble("lat")
        ),

        estimatedValue = getBigDecimal("estimated_value"),
        available = getBoolean("available"),

        metadata = getString("metadata"),

        createdAt = getTimestamp("created_at").toInstant(),
        updatedAt = getTimestamp("updated_at").toInstant(),

        weight = getDouble("weight"),
        length = getDouble("length"),
        height = getDouble("height"),
        width = getDouble("width")
    )
}

fun ItemEntity.toResponse(): ItemResponse {
    return ItemResponse(
        id = id.toString(),

        owner_id = owner_id.toString(),
        category_id = category_id?.toString(),
        condition_id = condition_id,
        default_damage_policy_id = default_damage_policy_id,

        name = name,
        description = description,

        images = images,

        currentLocation = currentLocation,

        estimatedValue = estimatedValue?.toDouble(),

        available = available,

        metadata = Json.parseToJsonElement(metadata).jsonObject,

        createdAt = createdAt,
        updatedAt = updatedAt,

        weight = weight,
        length = length,
        height = height,
        width = width
    )
}

fun ItemRequest.toEntity(): ItemEntity {
    return ItemEntity(

        id = id?.let { UUID.fromString(it) },

        owner_id = UUID.fromString(owner_id),

        category_id = category_id?.let { UUID.fromString(category_id) },

        condition_id = condition_id,

        default_damage_policy_id = default_damage_policy_id,

        name = name,

        description = description,

        images = images,

        currentLocation = currentLocation,

        estimatedValue = estimatedValue?.toBigDecimal(),

        available = available,

        metadata = Json.encodeToString(metadata),

        createdAt = Instant.now(),

        updatedAt = Instant.now(),

        weight = weight,
        length = length,
        height = height,
        width = width
    )
}