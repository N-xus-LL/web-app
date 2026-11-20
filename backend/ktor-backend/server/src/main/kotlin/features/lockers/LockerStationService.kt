package nexus.features.lockers

import features.common.spatial.GeoJsonPoint
import features.common.spatial.Locations
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import nexus.models.GeoPoint
import org.jetbrains.exposed.v1.core.JoinType
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import kotlin.uuid.Uuid
import kotlin.uuid.ExperimentalUuidApi

class LockerStationService {

    fun getLockerStations(availableOnly: Boolean = false): List<LockerStationResponse> = transaction {
        val rows = (LockerStations innerJoin Locations)
            .leftJoin(Lockers)
            .selectAll()
            .toList()

        rows
            .groupBy { it[LockerStations.id].value }
            .map { (_, group) ->
                val head = group.first()
                val lockerCount = group.count { it.getOrNull(Lockers.id) != null }
                val availableCount = group.count { it.getOrNull(Lockers.available) == true }
                LockerStationResponse(
                    id              = head[LockerStations.id].value.toString(),
                    station_name    = head[LockerStations.stationName],
                    address         = head[Locations.address],
                    location        = head[Locations.location].toGeoPoint(),
                    working_times   = head[LockerStations.workingTimes].jsonObject,
                    locker_count    = lockerCount,
                    available_count = availableCount
                )
            }
            .filter { !availableOnly || it.available_count > 0 }
            .sortedBy { it.station_name }
    }

    fun getLockerStationById(id: Uuid): LockerStationDetailResponse? = transaction {
        val stationRow = LockerStations
            .innerJoin(Locations)
            .selectAll()
            .where { LockerStations.id eq id }
            .singleOrNull()
            ?: return@transaction null

        val lockers = Lockers
            .selectAll()
            .where { Lockers.stationId eq id }
            .orderBy(Lockers.boxNumber to SortOrder.ASC)
            .map { it.toLockerResponse() }

        LockerStationDetailResponse(
            station = LockerStationResponse(
                id              = stationRow[LockerStations.id].value.toString(),
                station_name    = stationRow[LockerStations.stationName],
                address         = stationRow[Locations.address],
                location        = stationRow[Locations.location].toGeoPoint(),
                working_times   = stationRow[LockerStations.workingTimes].jsonObject,
                locker_count    = lockers.size,
                available_count = lockers.count { it.available }
            ),
            lockers = lockers
        )
    }

    private fun GeoJsonPoint.toGeoPoint() = GeoPoint(latitude = latitude, longitude = longitude)

    private fun org.jetbrains.exposed.v1.core.ResultRow.toLockerResponse() = LockerResponse(
        id               = this[Lockers.id].value.toString(),
        box_number       = this[Lockers.boxNumber],
        max_weight       = this[Lockers.maxWeight],
        max_length       = this[Lockers.maxLength],
        max_width        = this[Lockers.maxWidth],
        max_height       = this[Lockers.maxHeight],
        available        = this[Lockers.available],
        last_maintenance = this[Lockers.lastMaintenance]?.toString()
    )
}