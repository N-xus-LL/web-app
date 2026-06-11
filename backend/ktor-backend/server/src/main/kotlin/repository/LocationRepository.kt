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
                locality_id,
                ST_X(location) AS lon,
                ST_Y(location) AS lat,
                location_type,
                address,
                source_id,
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
                locality_id,
                ST_X(location) AS lon,
                ST_Y(location) AS lat,
                location_type,
                address,
                source_id,
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
                locality_id,
                location,
                location_type,
                address,
                source_id,
                metadata
            ) VALUES (
                ?, -- locality_id
                ST_SetSRID(ST_MakePoint(?, ?), 4326), -- lon, lat
                ?,  --  location_type
                ?,  --  address
                ?, -- source_id
                ?::jsonb -- metadata
            )
            RETURNING *, ST_X(location) AS lon, ST_Y(location) AS lat;
        """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.setObject(1, location.locality_id)
            stmt.setDouble(2, location.location.longitude)
            stmt.setDouble(3, location.location.latitude)
            stmt.setString(4, location.locationType)
            stmt.setString(5, location.address)
            stmt.setObject(6, location.source_id)
            stmt.setString(7, location.metadata)

            stmt.executeQuery().use { rs ->
                if (rs.next()) rs.toLocation() else error("Failed to create location")
            }
        }
    }

    fun updateLocation(location: LocationEntity): Boolean = transaction {
        val query = """
            UPDATE locations
            SET
                locality_id = ?,
                location = ST_SetSRID(ST_MakePoint(?, ?), 4326),
                location_type = ?,
                address = ?,
                source_id = ?,
                metadata = ?::jsonb
            WHERE id = ?
            RETURNING id;
        """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.setObject(1, location.locality_id)
            stmt.setDouble(2, location.location.longitude)
            stmt.setDouble(3, location.location.latitude)
            stmt.setString(4, location.locationType)
            stmt.setString(5, location.address)
            stmt.setObject(6, location.source_id)
            stmt.setString(7, location.metadata)
            stmt.setObject(8, location.id)

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
                locality_id,
                ST_X(location) AS lon,
                ST_Y(location) AS lat,
                location_type,
                address,
                source_id,
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
                locality_id,
                ST_X(location) AS lon,
                ST_Y(location) AS lat,
                location_type,
                address,
                source_id,
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
