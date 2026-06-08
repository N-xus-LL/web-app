package nexus.repository

import nexus.dsl.Location
import nexus.dsl.Locker
import nexus.dsl.LockerStation
import org.jetbrains.exposed.v1.jdbc.transactions.TransactionManager
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import java.sql.Connection

class DslRepository {
    fun getLockers(): MutableList<Locker> = transaction {
        val query = """
            SELECT
                lockers.id AS locker_id,
                lockers.box_number,
                lockers.max_weight,
                lockers.max_length,
                lockers.max_width,
                lockers.max_height,
                lockers.available,
                locker_stations.id AS station_id,
                locations.id AS location_id,
                ST_Y(locations.location) AS lat,
                ST_X(locations.location) AS lon,
                COALESCE(localities.name, '') AS city,
                locations.address
            FROM lockers
            JOIN locker_stations ON locker_stations.id = lockers.station_id
            JOIN locations ON locations.id = locker_stations.location_id
            LEFT JOIN localities ON localities.id = locations.locality_id
        """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.executeQuery().use { rs ->
                val result = mutableListOf<Locker>()

                while (rs.next()) {
                    val location = Location(
                        id = rs.getObject("location_id").toString(),
                        lat = rs.getDouble("lat"),
                        lon = rs.getDouble("lon"),
                        city = rs.getString("city"),
                        address = rs.getString("address")
                    )
                    val station = LockerStation(
                        id = rs.getObject("station_id").toString(),
                        location = location
                    )

                    result += Locker(
                        id = rs.getObject("locker_id").toString(),
                        station = station,
                        boxNumber = rs.getInt("box_number"),
                        maxWeight = rs.getDouble("max_weight"),
                        maxLength = rs.getDouble("max_length"),
                        maxWidth = rs.getDouble("max_width"),
                        maxHeight = rs.getDouble("max_height"),
                        available = rs.getBoolean("available")
                    )
                }

                result
            }
        }
    }
}
