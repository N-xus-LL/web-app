package nexus.util

import nexus.models.GeoPoint

fun formatGeoPoint(point: GeoPoint): String {
    return "POINT(${point.longitude} ${point.latitude})"
}