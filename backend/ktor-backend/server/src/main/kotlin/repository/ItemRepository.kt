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
                updated_at
            FROM items
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
            updated_at

        FROM items
        WHERE id = ?
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
            metadata
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
            ?::jsonb -- metadata
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

            stmt.setObject(13, item.id)

            stmt.executeQuery().use { rs ->

                rs.next()
            }
        }
    }

    fun deleteItem(id: UUID): Boolean = transaction {
        ItemTable.deleteWhere { ItemTable.id eq id } > 0
    }
}