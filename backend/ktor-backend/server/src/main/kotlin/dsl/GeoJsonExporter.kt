package nexus.dsl

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin

object GeoJsonExporter {
    fun exportApp(
        lender: LenderBlock,
        borrower: BorrowerBlock,
        referencePoint: Pair<Double, Double>,
        lockers: List<Locker>,
        referenceRadiusMeters: Double
    ): JsonObject {
        val visibleLockers = lockers
            .filter { it.isSelected }
            .sortedBy { it.distance }

        // For app mode, selected locker will be the only one in visibleLockers
        return featureCollection(
            buildList {
                add(userFeature("lender", lender.lat, lender.lon))
                add(userFeature("borrower", borrower.lat, borrower.lon))
                add(referenceFeature(referencePoint))
                add(referenceCircleFeature(referencePoint, referenceRadiusMeters))
                addAll(visibleLockers.map { lockerFeature(it, includeDebugProperties = false) })
            }
        )
    }

    fun exportDebug(
        lender: LenderBlock,
        borrower: BorrowerBlock,
        referencePoint: Pair<Double, Double>,
        lockers: List<Locker>,
        referenceRadiusMeters: Double
    ): JsonObject {
        // Separate selected locker from others
        val selectedLocker = lockers.find { it.isSelected }
        val otherLockers = lockers.filter { !it.isSelected }.sortedBy { it.distance }

        // Build features list with selected locker first
        val features = buildList {
            add(userFeature("lender", lender.lat, lender.lon))
            add(userFeature("borrower", borrower.lat, borrower.lon))
            add(referenceFeature(referencePoint))
            add(referenceCircleFeature(referencePoint, referenceRadiusMeters))

            // Add selected locker first so it renders on top
            if (selectedLocker != null) {
                add(lockerFeature(selectedLocker, includeDebugProperties = true))
            }

            // Add remaining lockers
            addAll(otherLockers.map { lockerFeature(it, includeDebugProperties = true) })
        }

        return featureCollection(features)
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
                put("marker-color", when(role) {
                    "lender" -> "#0087CC"   // Blue
                    "borrower" -> "#72E57C" // Mint Green
                    else -> "#AAAAAA"       // Medium Gray
                })
                put("marker-size", "large")
            }
        )

    private fun referenceFeature(referencePoint: Pair<Double, Double>): JsonObject =
        pointFeature(
            lon = referencePoint.second,
            lat = referencePoint.first,
            properties = buildJsonObject {
                put("kind", "reference_point")
                put("label", "Reference point")
                put("marker-color", "#39B6A4") // Maroon
                put("marker-size", "medium")
            }
        )

    private fun referenceCircleFeature(referencePoint: Pair<Double, Double>, radiusMeters: Double): JsonObject {
        /**
         * Calculates the destination point from a start point given a bearing and distance.
         * Uses the spherical law of cosines formula.
         *
         * @param lat Starting latitude in degrees
         * @param lon Starting longitude in degrees
         * @param bearingRadians Direction in radians (0 = North, π/2 = East, π = South, 3π/2 = West)
         * @param distanceMeters Distance to travel in meters
         * @return Pair<Double, Double> of (latitude, longitude) in degrees
         */
        fun calculateDestinationPoint(
            lat: Double,
            lon: Double,
            bearingRadians: Double,
            distanceMeters: Double
        ): Pair<Double, Double> {
            val earthRadius = 6371000.0 // Earth's radius in meters
            val latRad = Math.toRadians(lat)
            val lonRad = Math.toRadians(lon)

            val angularDistance = distanceMeters / earthRadius // Angular distance in radians

            // Calculate destination latitude
            val destLatRad = asin(
                sin(latRad) * cos(angularDistance) +
                        cos(latRad) * sin(angularDistance) * cos(bearingRadians)
            )

            // Calculate destination longitude
            val destLonRad = lonRad + atan2(
                sin(bearingRadians) * sin(angularDistance) * cos(latRad),
                cos(angularDistance) - sin(latRad) * sin(destLatRad)
            )

            return Pair(Math.toDegrees(destLatRad), Math.toDegrees(destLonRad))
        }

        val (lat, lon) = referencePoint
        val points = 64
        val coordinates = buildJsonArray {
            val ring = buildJsonArray {
                for (i in 0..points) {
                    val bearing = Math.toRadians((360.0 / points) * i)
                    val point = calculateDestinationPoint(lat, lon, bearing, radiusMeters)
                    add(buildJsonArray {
                        add(point.second) // lon
                        add(point.first)  // lat
                    })
                }
            }
            add(ring)
        }

        return buildJsonObject {
            put("type", "Feature")
            put("geometry", buildJsonObject {
                put("type", "Polygon")
                put("coordinates", coordinates)
            })
            put("properties", buildJsonObject {
                put("kind", "reference_circle")
                put("label", "Final search radius")
                put("stroke", "#39B6A4")
                put("stroke-width", 2)
                put("stroke-opacity", 1.0)
                put("fill", "#39B6A4")
                put("fill-opacity", 0.1)
                put("radius_meters", radiusMeters)
            })
        }
    }

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

                // Add color based on status
                put("marker-color", when {
                    locker.isSelected                         -> "#2ECC40" // Green for selected
                    locker.status == LockerStatus.MATCHING    -> "#F5A623" // Orange for matching
                    locker.status == LockerStatus.UNAVAILABLE -> "#FF4136" // Red for unavailable
                    locker.status == LockerStatus.UNFITTING   -> "#9B9B9B" // Neutral Gray for unfitting
                    else                                      -> "#AAAAAA" // Medium Gray for unknown
                })

                // Add marker size based on importance
                put("marker-size", if (locker.isSelected) "large" else "medium")

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