package nexus.models

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class ItemRequest(
    val id: String? = null,
    val owner_id: String,
    val category_id: String?,
    val condition_id: String?,
    val default_damage_policy_id: String?,
    val name: String,
    val description: String?,
    val images: List<String>,
    val currentLocation: GeoPoint,
    val available: Boolean,
    val weight: Double,
    val length: Double,
    val width: Double,
    val height: Double,
    val estimatedValue: Double?,
    val metadata: JsonObject
)