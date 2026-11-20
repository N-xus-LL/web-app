package nexus.features.lockers

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import nexus.models.GeoPoint

@Serializable
data class LockerStationResponse(
    val id: String,
    val station_name: String,
    val address: String,
    val location: GeoPoint,
    val working_times: JsonObject,
    val locker_count: Int,
    val available_count: Int
)

@Serializable
data class LockerResponse(
    val id: String,
    val box_number: Short,
    val max_weight: Double,
    val max_length: Double,
    val max_width: Double,
    val max_height: Double,
    val available: Boolean,
    val last_maintenance: String? = null
)

@Serializable
data class LockerStationDetailResponse(
    val station: LockerStationResponse,
    val lockers: List<LockerResponse>
)