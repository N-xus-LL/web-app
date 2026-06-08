package dsl

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import nexus.dsl.BorrowerBlock
import nexus.dsl.LenderBlock

object GeoJsonExporter {
    fun exportApp(
        lender: LenderBlock,
        borrower: BorrowerBlock,
        meetingPoint: Pair<Double, Double>,
        lockers: List<Locker>
    ): JsonObject {
        try {
            val visibleLockers = lockers
                .filter { it.isSelected }
                .sortedBy { it.distance }

            return featureCollection(
                buildList {
                    add(userFeature("lender", lender.lat, lender.lon))
                    add(userFeature("borrower", borrower.lat, borrower.lon))
                    add(meetingFeature(meetingPoint))
                    addAll(visibleLockers.map { lockerFeature(it, includeDebugProperties = false) })
                }
            )
        } catch (e : Exception) {
            println(e.message)
        }

        return JsonObject(mapOf())
    }

    fun exportDebug(
        lender: LenderBlock,
        borrower: BorrowerBlock,
        meetingPoint: Pair<Double, Double>,
        referencePoint: Pair<Double, Double>,
        lockers: List<Locker>
    ): JsonObject {
        try {
            val visibleLockers = lockers
                .sortedBy { it.distance }

            return featureCollection(
                buildList {
                    add(userFeature("lender", lender.lat, lender.lon))
                    add(userFeature("borrower", borrower.lat, borrower.lon))
                    add(meetingFeature(meetingPoint))
                    add(referenceFeature(referencePoint))
                    addAll(visibleLockers.map { lockerFeature(it, includeDebugProperties = true) })
                }
            )
        } catch (e : Exception) {
            println(e.message)
        }

        return JsonObject(mapOf())
    }

    private fun featureCollection(features: List<JsonObject>): JsonObject =
        buildJsonObject {
            put("type", "FeatureCollection")
            put("features", JsonArray(features))
        }

    private fun userFeature(role: String, lat: Double, lon: Double): JsonObject =
        pointFeature(
            lon = lon,
            lat = lat,
            properties = buildJsonObject {
                put("kind", "user")
                put("role", role)
                put("label", role.replaceFirstChar { it.uppercase() })
            }
        )

    private fun meetingFeature(meetingPoint: Pair<Double, Double>): JsonObject =
        pointFeature(
            lon = meetingPoint.second,
            lat = meetingPoint.first,
            properties = buildJsonObject {
                put("kind", "meeting_point")
                put("label", "Meeting Point")
            }
        )

    private fun referenceFeature(referencePoint: Pair<Double, Double>): JsonObject =
        pointFeature(
            lon = referencePoint.second,
            lat = referencePoint.first,
            properties = buildJsonObject {
                put("kind", "reference_point")
                put("label", "Reference Point")
            }
        )

    private fun lockerFeature(locker: Locker, includeDebugProperties: Boolean): JsonObject {
        val location = locker.station.location
        return pointFeature(
            lon = location.lon,
            lat = location.lat,
            properties = buildJsonObject {
                put("kind", "locker")
                put("id", locker.id)
                put("station_id", locker.station.id)
                put("location_id", location.id)
                put("box_number", locker.boxNumber)
                put("status", locker.status.name.lowercase())
                put("selected", locker.isSelected)
                put("available", locker.available)
                put("distance_m", locker.distance)
                put("city", location.city)
                put("address", location.address)

                if (includeDebugProperties) {
                    put("max_weight_kg", locker.maxWeightKg)
                    put("max_length_cm", locker.maxLengthCm)
                    put("max_width_cm", locker.maxWidthCm)
                    put("max_height_cm", locker.maxHeightCm)
                }
            }
        )
    }

    private fun pointFeature(lon: Double, lat: Double, properties: JsonObject): JsonObject =
        buildJsonObject {
            put("type", "Feature")
            put(
                "geometry",
                buildJsonObject {
                    put("type", "Point")
                    put(
                        "coordinates",
                        buildJsonArray {
                            add(lon)
                            add(lat)
                        }
                    )
                }
            )
            put("properties", properties)
        }
}
