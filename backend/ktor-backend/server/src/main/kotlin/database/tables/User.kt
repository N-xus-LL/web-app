package nexus.database.tables

import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable
import org.jetbrains.exposed.v1.javatime.timestamp
//import org.jetbrains.exposed.v1.sql.javatime.timestamp

object Users : UUIDTable() {
    val email = text("email").uniqueIndex()
    val username = text("username").uniqueIndex()
    val firstName = text("first_name")
    val lastName = text("last_name")
    val passwordHash = text("password_hash")
    val currentLocation = text("current_location").nullable()
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
}