package nexus.api.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import nexus.api.serializers.InstantSerializer
import nexus.models.GeoPoint
import java.time.Instant

@Serializable
data class ItemResponse(
    val id: String,
    val owner_id: String,
    val category_id: String?,
    val condition_id: String?,
    val default_damage_policy_id: String?,
    val name: String,
    val description: String?,
    val images: List<String>,
    val currentLocation: GeoPoint,
    val estimatedValue: Double?,
    val available: Boolean,
    val metadata: JsonObject,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant,
    @Serializable(with = InstantSerializer::class)
    val updatedAt: Instant
)