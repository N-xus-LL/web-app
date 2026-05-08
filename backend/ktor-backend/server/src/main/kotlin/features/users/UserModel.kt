package nexus.features.users

import features.common.spatial.point
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.javatime.CurrentDateTime
import org.jetbrains.exposed.v1.javatime.datetime

import kotlin.uuid.Uuid
import kotlin.uuid.ExperimentalUuidApi
@OptIn(ExperimentalUuidApi::class)

object Users : Table("users") {
    // Primary Key using Native Kotlin Uuid
    val id = uuid("id").clientDefault { Uuid.random() }

    // Core Identity Fields
    val username = text("username").uniqueIndex()
    val email = text("email").uniqueIndex()
    val firstName = text("first_name")
    val lastName = text("last_name")
    val passwordHash = text("password_hash")

    /**
     * PostGIS Point (SRID 4326)
     * In 2026, we use a custom column type or the standard spatial extension.
     * If using a raw string for WKT (Well-Known Text), map it as text.
     */
    val currentLocation = point("current_location").nullable()

    // Timestamps
    // The DB trigger handles 'updated_at', but we define it here for Exposed visibility.
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
    val updatedAt = datetime("updated_at").defaultExpression(CurrentDateTime)

    override val primaryKey = PrimaryKey(id)
}