package nexus.database

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import nexus.api.model.LocationResponse
import java.sql.ResultSet
import nexus.models.GeoPoint
import java.util.UUID

fun ResultSet.toLocation(): LocationEntity {
    return LocationEntity(
        id = UUID.fromString(getString("id")),
        name = getString("name"),
        locationType = getString("location_type"),
        location = GeoPoint(
            latitude = getDouble("lat"),
            longitude = getDouble("lon")
        ),
        source = getString("source"),
        metadata = getString("metadata")
    )
}

fun LocationEntity.toResponse(): LocationResponse {
    return LocationResponse(
        id = id.toString(),
        name = name,
        locationType = locationType,
        location = location,
        source = source,
        metadata = Json.parseToJsonElement(metadata).jsonObject
    )
}
