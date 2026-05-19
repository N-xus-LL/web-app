package nexus.repository

import nexus.database.LocationEntity
import nexus.database.toLocation
import org.jetbrains.exposed.v1.jdbc.transactions.TransactionManager
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import java.sql.Connection
import java.sql.ResultSet
import java.util.UUID

class LocationRepository {

    fun getLocations(): List<LocationEntity> = transaction {
        val query = """
            SELECT
                id,
                name,
                location_type,
                ST_X(location) AS lon,
                ST_Y(location) AS lat,
                source,
                metadata
            FROM locations
        """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.executeQuery().use { rs ->
                val list = mutableListOf<LocationEntity>()
                while (rs.next()) list += rs.toLocation()
                list
            }
        }
    }

    fun getLocationById(id: UUID): LocationEntity? = transaction {
        val query = """
            SELECT
                id,
                name,
                location_type,
                ST_X(location) AS lon,
                ST_Y(location) AS lat,
                source,
                metadata
            FROM locations
            WHERE id = ?
        """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.setObject(1, id)
            stmt.executeQuery().use { rs ->
                if (rs.next()) rs.toLocation() else null
            }
        }
    }

    fun createLocation(location: LocationEntity): LocationEntity = transaction {
        val query = """
            INSERT INTO locations (
                name,
                location_type,
                location,
                source,
                metadata
            ) VALUES (
                ?, -- name
                ?, -- location_type
                ST_SetSRID(ST_MakePoint(?, ?), 4326), -- lon, lat
                ?, -- source
                ?::jsonb
            )
            RETURNING *, ST_X(location) AS lon, ST_Y(location) AS lat;
        """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.setString(1, location.name)
            stmt.setString(2, location.locationType)
            stmt.setDouble(3, location.location.longitude)
            stmt.setDouble(4, location.location.latitude)
            stmt.setString(5, location.source)
            stmt.setString(6, location.metadata)

            stmt.executeQuery().use { rs ->
                if (rs.next()) rs.toLocation() else error("Failed to create location")
            }
        }
    }

    fun updateLocation(location: LocationEntity): Boolean = transaction {
        val query = """
            UPDATE locations
            SET
                name = ?,
                location_type = ?,
                location = ST_SetSRID(ST_MakePoint(?, ?), 4326),
                source = ?,
                metadata = ?::jsonb
            WHERE id = ?
            RETURNING id;
        """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.setString(1, location.name)
            stmt.setString(2, location.locationType)
            stmt.setDouble(3, location.location.longitude)
            stmt.setDouble(4, location.location.latitude)
            stmt.setString(5, location.source)
            stmt.setString(6, location.metadata)
            stmt.setObject(7, location.id)

            stmt.executeQuery().use { rs -> rs.next() }
        }
    }

    fun deleteLocation(id: UUID): Boolean = transaction {
        val query = "DELETE FROM locations WHERE id = ?"
        val jdbcConnection = TransactionManager.current().connection.connection as Connection
        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.setObject(1, id)
            stmt.executeUpdate() > 0
        }
    }

    fun closestLocation(lat: Double, lon: Double): LocationEntity? = transaction {
        val query = """
            SELECT
                id,
                name,
                location_type,
                ST_X(location) AS lon,
                ST_Y(location) AS lat,
                source,
                metadata
            FROM locations
            ORDER BY location <-> ST_SetSRID(ST_MakePoint(?, ?), 4326)
            LIMIT 1
        """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.setObject(1, lon)
            stmt.setObject(2, lat)
            stmt.executeQuery().use { rs ->
                if (rs.next()) rs.toLocation() else null
            }
        }
    }

    fun nearbyLocations(lat: Double, lon: Double, radius: Double): List<LocationEntity> = transaction {
        val query = """
            SELECT
                id,
                name,
                location_type,
                ST_X(location) AS lon,
                ST_Y(location) AS lat,
                source,
                metadata
            FROM locations
            WHERE ST_DWithin(
                location::geography,
                ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
                ?
            )
            ORDER BY ST_Distance(
                location::geography,
                ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
            )
        """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.setObject(1, lon)
            stmt.setObject(2, lat)
            stmt.setObject(3, radius)
            stmt.setObject(4, lon)
            stmt.setObject(5, lat)
            stmt.executeQuery().use { rs ->
                val list = mutableListOf<LocationEntity>()
                while (rs.next()) list += rs.toLocation()
                list
            }
        }
    }
}
