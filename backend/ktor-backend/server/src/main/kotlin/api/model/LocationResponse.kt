package nexus.api.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import nexus.models.GeoPoint

@Serializable
data class LocationResponse(
    val id: String,
    val name: String,
    val locationType: String? = null,
    val location: GeoPoint,
    val source: String? = null,
    val metadata: JsonObject
)
