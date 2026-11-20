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
        val raw = value.toString()
        // Accept both "POINT(lng lat)" and "SRID=4326;POINT(lng lat)"
        val wkt = raw.substringAfter("POINT(", raw)
            .substringBefore(")")
        val parts = wkt.trim().split(Regex("\\s+"))
        if (parts.size < 2) return null
        val lng = parts[0].toDoubleOrNull() ?: return null
        val lat = parts[1].toDoubleOrNull() ?: return null
        return GeoJsonPoint.fromLngLat(lng, lat)
    }

    override fun notNullValueToDB(value: GeoJsonPoint): Any {
        // Converts our object to a format Postgres understands for insertion
        return "ST_GeomFromText('POINT(${value.longitude} ${value.latitude})', 4326)"
    }
}

// Extension function to make it easy to use in Table objects
fun Table.point(name: String): Column<GeoJsonPoint> = registerColumn(name, PostGisPointColumnType())
