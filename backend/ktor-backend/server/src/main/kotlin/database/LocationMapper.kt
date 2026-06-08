package nexus.database

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import nexus.api.model.LocationRequest
import nexus.api.model.LocationResponse
import java.sql.ResultSet
import nexus.models.GeoPoint
import java.util.UUID

fun ResultSet.toLocation(): LocationEntity {
    return LocationEntity(
        id = UUID.fromString(getString("id")),
        locality_id = UUID.fromString(getString("locality_id")),
        locationType = getString("location_type"),
        location = GeoPoint(
            latitude = getDouble("lat"),
            longitude = getDouble("lon")
        ),
        address = getString("address"),
        source_id = UUID.fromString(getString("source_id")),
        metadata = getString("metadata")
    )
}

fun LocationEntity.toResponse(): LocationResponse {
    return LocationResponse(
        id = id.toString(),
        locality_id = locality_id.toString(),
        locationType = locationType,
        location = location,
        address = address,
        source_id = source_id.toString(),
        metadata = Json.parseToJsonElement(metadata).jsonObject
    )
}

fun LocationRequest.toEntity(): LocationEntity {
    return LocationEntity(
        id = id?.let { UUID.fromString(it) },
        locality_id = UUID.fromString(locality_id),
        locationType = locationType,
        location = location,
        address = address,
        source_id = UUID.fromString(source_id),
        metadata = Json.encodeToString(metadata)
    )
}
