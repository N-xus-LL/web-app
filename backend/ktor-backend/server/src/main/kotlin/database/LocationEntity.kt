package nexus.database

import nexus.models.GeoPoint
import java.util.UUID

data class LocationEntity(
    val id: UUID? = null,
    val locality_id: UUID,
    val location: GeoPoint,
    val locationType: String,
    val address: String,
    val source_id: UUID,
    val metadata: String
)
