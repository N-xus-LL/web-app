package nexus.utils

import nexus.models.GeoPoint

fun parseGeoPoint(value: String): GeoPoint {
    val cleaned = value
        .removePrefix("POINT(")
        .removeSuffix(")")
        .split(" ")

    return GeoPoint(
        longitude = cleaned[0].toDouble(),
        latitude = cleaned[1].toDouble()
    )
}