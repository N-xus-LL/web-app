package nexus.features.lockers

import features.common.spatial.Locations
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.dao.id.UuidTable
import org.jetbrains.exposed.v1.datetime.date
import org.jetbrains.exposed.v1.json.jsonb
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement

object LockerStations : UuidTable("locker_stations") {
    val locationId = uuid("location_id")
        .references(Locations.id, onDelete = ReferenceOption.CASCADE)
    val stationName = text("station_name")
    val workingTimes = jsonb<JsonElement>("working_times", Json.Default)
}

object Lockers : UuidTable("lockers") {
    val stationId = uuid("station_id")
        .references(LockerStations.id, onDelete = ReferenceOption.CASCADE)
    val boxNumber = short("box_number")
    val maxWeight = double("max_weight")
    val maxLength = double("max_length")
    val maxWidth  = double("max_width")
    val maxHeight = double("max_height")
    val available = bool("available").default(true)
    val lastMaintenance = date("last_maintenance").nullable()

    init {
        uniqueIndex(stationId, boxNumber)
    }
}