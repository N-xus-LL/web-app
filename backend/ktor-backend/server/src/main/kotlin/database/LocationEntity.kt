package nexus.database

import nexus.models.GeoPoint
import java.util.UUID

data class LocationEntity(
    val id: UUID? = null,
    val name: String,
    val locationType: String?,
    val location: GeoPoint,
    val source: String?,
    val metadata: String
)
