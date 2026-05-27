package nexus.database.tables

import features.common.spatial.point
import org.jetbrains.exposed.v1.core.dao.id.UuidTable
import org.jetbrains.exposed.v1.datetime.CurrentTimestamp
import org.jetbrains.exposed.v1.datetime.timestamp

object Users : UuidTable("users") {
    val email = text("email").uniqueIndex()
    val username = text("username").uniqueIndex()
    val firstName = text("first_name")
    val lastName = text("last_name")
    val passwordHash = text("password_hash")
    val currentLocation = point("current_location").nullable()
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp)
    val updatedAt = timestamp("updated_at").defaultExpression(CurrentTimestamp)
}