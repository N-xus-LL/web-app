package nexus.database.tables

import org.jetbrains.exposed.v1.core.dao.id.java.UUIDTable

object Users : UUIDTable() {
    val email = text("email").uniqueIndex()
    val username = text("username").uniqueIndex()
    val firstName = text("first_name")
    val lastName = text("last_name")
    val passwordHash = text("password_hash")
}