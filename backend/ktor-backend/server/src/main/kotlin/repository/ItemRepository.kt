package nexus.repository

import nexus.database.ItemEntity
import nexus.database.tables.ItemTable
import nexus.database.toItem
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.transactions.TransactionManager
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import java.sql.ResultSet
import java.time.Instant
import java.util.UUID
import java.sql.Connection
class ItemRepository() {

    fun getItems(): List<ItemEntity> = transaction {
        val query = """
            SELECT 
                id,
                owner_id,
                category_id,
                condition_id,
                default_damage_policy_id,
                name,
                description,
                images,
                ST_X(current_location) AS lon,
                ST_Y(current_location) AS lat,
                estimated_value,
                available,
                metadata,
                created_at,
                updated_at,
                weight,
                length,
                height,
                width
            FROM items;
        """.trimIndent()
        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->

            stmt.executeQuery().use { rs ->
                val list = mutableListOf<ItemEntity>()
                while (rs.next()) list += rs.toItem()
                list
            }
        }
    }

    fun getItemById(id: UUID): ItemEntity? = transaction {
        val query = """
        SELECT
            id,
            owner_id,
            category_id,
            condition_id,
            default_damage_policy_id,
            name,
            description,
            images,

            ST_X(current_location) AS lon,
            ST_Y(current_location) AS lat,

            estimated_value,
            available,
            metadata,
            created_at,
            updated_at,
            
            weight,
            length,
            height,
            width

        FROM items
        WHERE id = ?;
    """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->

            stmt.setObject(1, id)

            stmt.executeQuery().use { rs ->

                if (rs.next()) {
                    rs.toItem()
                } else {
                    null
                }
            }
        }

    }

    fun createItem(item: ItemEntity): ItemEntity = transaction {
        val query = """
        INSERT INTO items (
            owner_id,
            category_id,
            condition_id,
            default_damage_policy_id,
        
            name,
            description,
            images,
        
            current_location,
        
            estimated_value,
            available,
            metadata,
            
            weight,
            length,
            height,
            width
        )
        VALUES (
            ?, -- owner_id
            ?, -- category_id
            ?, -- condition_id
            ?, -- default_damage_policy_id
        
            ?, -- name
            ?, -- description
            ?, -- images
        
            ST_SetSRID(ST_MakePoint(?, ?), 4326),
        
            ?, -- estimated_value
            ?, -- available
            ?::jsonb, -- metadata
            ?, -- weight
            ?, -- length
            ?, -- height
            ? -- width
        )
        RETURNING *,
    ST_X(current_location) AS lon,
    ST_Y(current_location) AS lat;
    """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->

            stmt.setObject(1, item.owner_id)
            stmt.setObject(2, item.category_id)
            stmt.setString(3, item.condition_id)
            stmt.setString(4, item.default_damage_policy_id)

            stmt.setString(5, item.name)
            stmt.setString(6, item.description)

            val imagesArray = jdbcConnection.createArrayOf(
                "text",
                item.images.toTypedArray()
            )
            stmt.setArray(7, imagesArray)

            stmt.setDouble(8, item.currentLocation.longitude)
            stmt.setDouble(9, item.currentLocation.latitude)

            stmt.setBigDecimal(
                10,
                item.estimatedValue
            )

            stmt.setBoolean(11, item.available)

            stmt.setString(
                12,
                item.metadata
            )

            stmt.setDouble(13, item.weight)
            stmt.setDouble(14, item.length)
            stmt.setDouble(15, item.height)
            stmt.setDouble(16, item.width)

            stmt.executeQuery().use { rs ->

                if (rs.next()) {
                    rs.toItem()
                } else {
                    error("Failed to create item")
                }
            }
        }
    }

    fun updateItem(item: ItemEntity): Boolean = transaction {
        val query = """
            UPDATE items
            SET
                owner_id = ?,
                category_id = ?,
                condition_id = ?,
                default_damage_policy_id = ?,

                name = ?,
                description = ?,
                images = ?,

                current_location = ST_SetSRID(ST_MakePoint(?, ?), 4326),

                estimated_value = ?,
                available = ?,
                metadata = ?::jsonb,

                weight = ?,
                length = ?,
                height = ?,
                width = ?

                updated_at = CURRENT_TIMESTAMP

            WHERE id = ?
            RETURNING id;
        """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->

            stmt.setObject(1, item.owner_id)
            stmt.setObject(2, item.category_id)
            stmt.setString(3, item.condition_id)
            stmt.setString(4, item.default_damage_policy_id)

            stmt.setString(5, item.name)
            stmt.setString(6, item.description)

            val imagesArray = jdbcConnection.createArrayOf(
                "text",
                item.images.toTypedArray()
            )
            stmt.setArray(7, imagesArray)

            stmt.setDouble(8, item.currentLocation.longitude)
            stmt.setDouble(9, item.currentLocation.latitude)

            stmt.setBigDecimal(
                10,
                item.estimatedValue
            )

            stmt.setBoolean(11, item.available)

            stmt.setString(
                12,
                item.metadata
            )

            stmt.setDouble(13, item.weight)
            stmt.setDouble(14, item.length)
            stmt.setDouble(15, item.height)
            stmt.setDouble(16, item.width)

            stmt.setObject(17, item.id)

            stmt.executeQuery().use { rs ->

                rs.next()
            }
        }
    }

    fun deleteItem(id: UUID): Boolean = transaction {
        ItemTable.deleteWhere { ItemTable.id eq id } > 0
    }

    fun closestItem(lat: Double, lon: Double): ItemEntity? = transaction {
        val query = """
            SELECT 
                id,
                owner_id,
                category_id,
                condition_id,
                default_damage_policy_id,
                name,
                description,
                images,
                ST_X(current_location) AS lon,
                ST_Y(current_location) AS lat,
                estimated_value,
                available,
                metadata,
                created_at,
                updated_at,
                weight,
                length,
                height,
                width
            FROM items
            ORDER BY current_location <-> ST_SetSRID(ST_MakePoint(?, ?), 4326)
            LIMIT 1;
        """.trimIndent()

        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.setObject(1, lon)
            stmt.setObject(2, lat)

            stmt.executeQuery().use { rs ->

                if (rs.next()) {
                    rs.toItem()
                } else {
                    null
                }
            }
        }
    }

    fun nearbyItems(lat: Double, lon: Double, radius: Double): List<ItemEntity> = transaction {
        // radius is in meters, if you want degrees remove ::geography
        val query = """
            SELECT 
                id,
                owner_id,
                category_id,
                condition_id,
                default_damage_policy_id,
                name,
                description,
                images,
                ST_X(current_location) AS lon,
                ST_Y(current_location) AS lat,
                estimated_value,
                available,
                metadata,
                created_at,
                updated_at,
                weight,
                length,
                height,
                width
            FROM items
            WHERE ST_DWithin(
                current_location::geography,
                ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
                ?
            )
            ORDER BY ST_Distance(
                current_location::geography,
                ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
            );
        """.trimIndent()
        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.setObject(1, lon)
            stmt.setObject(2, lat)
            stmt.setObject(3, radius)
            stmt.setObject(4, lon)
            stmt.setObject(5, lat)

            stmt.executeQuery().use { rs ->
                val list = mutableListOf<ItemEntity>()
                while (rs.next()) list += rs.toItem()
                list
            }
        }
    }

    fun getUserItems(id: UUID): List<ItemEntity> = transaction {
        val query = """
            SELECT 
                id,
                owner_id,
                category_id,
                condition_id,
                default_damage_policy_id,
                name,
                description,
                images,
                ST_X(current_location) AS lon,
                ST_Y(current_location) AS lat,
                estimated_value,
                available,
                metadata,
                created_at,
                updated_at,
                weight,
                length,
                height,
                width
            FROM items
            WHERE owner_id = ?;
        """.trimIndent()
        val jdbcConnection = TransactionManager.current().connection.connection as Connection

        jdbcConnection.prepareStatement(query).use { stmt ->
            stmt.setObject(1, id)

            stmt.executeQuery().use { rs ->
                val list = mutableListOf<ItemEntity>()
                while (rs.next()) list += rs.toItem()
                list
            }
        }
    }
}