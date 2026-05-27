package nexus.api.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonNames
import kotlinx.serialization.json.JsonObject
import nexus.models.GeoPoint

@Serializable
data class LocationRequest(
    val name: String,
    @SerialName("location_type")
    @JsonNames("locationType")
    val locationType: String? = null,
    val location: GeoPoint,
    val source: String? = null,
    val metadata: JsonObject = JsonObject(mapOf())
)
