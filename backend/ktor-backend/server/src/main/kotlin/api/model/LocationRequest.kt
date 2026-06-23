package nexus.api.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import nexus.models.GeoPoint

@Serializable
data class LocationRequest(
    val id: String? = null,
    val locality_id: String,
    val location: GeoPoint,
    val locationType: String,
    val address: String,
    val source_id: String,
    val metadata: JsonObject
)
