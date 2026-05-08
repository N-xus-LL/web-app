package nexus.repository

import nexus.database.Users

import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.core.*

class UserRepository {

     fun createUser(
        email: String,
        username: String,
        firstName: String,
        lastName: String,
        passwordHash: String
    ) {
        transaction {
            Users.insert {
                it[Users.email] = email
                it[Users.username] = username
                it[Users.firstName] = firstName
                it[Users.lastName] = lastName
                it[Users.passwordHash] = passwordHash
            }
        }
    }

    fun getUserByEmail(email: String) = transaction {
        Users
            .selectAll()
            .where { Users.email eq email }
            .map {
                mapOf(
                    "username" to it[Users.username],
                    "email" to it[Users.email]
                )
            }
            .firstOrNull()
    }
}