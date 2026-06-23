package features.common.spatial

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.ColumnType
import org.jetbrains.exposed.v1.core.Table

@Serializable
data class GeoJsonPoint(
    // GeoJSON uses [longitude, latitude] order
    val coordinates: List<Double>
) {
    val longitude: Double get() = coordinates[0]
    val latitude: Double get() = coordinates[1]

    companion object {
        fun fromLngLat(lng: Double, lat: Double) = GeoJsonPoint(
            coordinates = listOf(lng, lat)
        )
    }
}

/**
 * A simplified ColumnType to bridge PostGIS and your Kotlin GeoJsonPoint.
 * This handles the "ST_AsText" and "ST_GeomFromText" logic behind the scenes.
 */
class PostGisPointColumnType : ColumnType<GeoJsonPoint>() {
    override fun sqlType(): String = "GEOMETRY(POINT, 4326)"

    override fun valueFromDB(value: Any): GeoJsonPoint? {
        // Value usually comes back from Postgres as a WKT string: POINT(12.34 56.78)
        if (value !is String) return null
        val coords = value.removePrefix("POINT(").removeSuffix(")")
            .split(" ")
            .map { it.toDouble() }
        return GeoJsonPoint.fromLngLat(coords[0], coords[1])
    }

    override fun notNullValueToDB(value: GeoJsonPoint): Any {
        // Converts our object to a format Postgres understands for insertion
        return "ST_GeomFromText('POINT(${value.longitude} ${value.latitude})', 4326)"
    }
}

// Extension function to make it easy to use in Table objects
fun Table.point(name: String): Column<GeoJsonPoint> = registerColumn(name, PostGisPointColumnType())
