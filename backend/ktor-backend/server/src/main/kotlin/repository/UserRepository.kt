package nexus.repository

import nexus.database.tables.Users

import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.core.*
import java.util.UUID

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

    fun getUserById(id: UUID) = transaction {
        Users
            .selectAll()
            .where { Users.id eq id }
            .map {
                mapOf(
                    "id" to it[Users.id].value.toString(),
                    "username" to it[Users.username],
                    "email" to it[Users.email],
                    "firstName" to it[Users.firstName],
                    "lastName" to it[Users.lastName],
                    "currentLocation" to it[Users.currentLocation]?.toString(),
                    "createdAt" to it[Users.createdAt].toString(),
                    "updatedAt" to it[Users.updatedAt].toString()
                )
            }
            .firstOrNull()
    }


    fun getUserByUsername(user: String) = transaction {
        Users
            .selectAll()
            .where { Users.username eq user }
            .map {
                mapOf(
                    "id" to it[Users.id].value.toString(),
                    "username" to it[Users.username],
                    "email" to it[Users.email],
                    "firstName" to it[Users.firstName],
                    "lastName" to it[Users.lastName],
                    "currentLocation" to it[Users.currentLocation],
                    "createdAt" to it[Users.createdAt].toString(),
                    "updatedAt" to it[Users.updatedAt].toString()
                )
            }
            .firstOrNull()
    }

    fun getUserByEmailAndPassword(email: String, password: String) = transaction {
        Users
            .selectAll()
            .where { (Users.email eq email) and (Users.passwordHash eq password) }
            .map {
                mapOf(
                    "id" to it[Users.id].value.toString(),
                    "username" to it[Users.username],
                    "email" to it[Users.email],
                    "firstName" to it[Users.firstName],
                    "lastName" to it[Users.lastName],
                    "currentLocation" to it[Users.currentLocation]?.toString(),
                    "createdAt" to it[Users.createdAt].toString(),
                    "updatedAt" to it[Users.updatedAt].toString()
                )
            }
            .firstOrNull()
    }

    fun getUserByUsernameAndPassword(username: String, password: String) = transaction {
        Users
            .selectAll()
            .where { (Users.username eq username) and (Users.passwordHash eq password) }
            .map {
                mapOf(
                    "id" to it[Users.id].value.toString(),
                    "username" to it[Users.username],
                    "email" to it[Users.email],
                    "firstName" to it[Users.firstName],
                    "lastName" to it[Users.lastName],
                    "currentLocation" to it[Users.currentLocation]?.toString(),
                    "createdAt" to it[Users.createdAt].toString(),
                    "updatedAt" to it[Users.updatedAt].toString()
                )
            }
            .firstOrNull()
    }

    fun getAllUsers() = transaction {
        Users
            .selectAll()
            .map {
                mapOf(
                    "id" to it[Users.id].value.toString(),
                    "username" to it[Users.username],
                    "email" to it[Users.email],
                    "firstName" to it[Users.firstName],
                    "lastName" to it[Users.lastName],
                    "currentLocation" to it[Users.currentLocation]?.toString(),
                    "createdAt" to it[Users.createdAt].toString(),
                    "updatedAt" to it[Users.updatedAt].toString()
                )
            }
    }

    fun updateUser(
        id: UUID,
        username: String? = null,
        firstName: String? = null,
        lastName: String? = null,
        passwordHash: String? = null
    ) = transaction {
        Users.update({ Users.id eq id }) {
            username?.let { u -> it[Users.username] = u }
            firstName?.let { f -> it[Users.firstName] = f }
            lastName?.let { l -> it[Users.lastName] = l }
            passwordHash?.let { p -> it[Users.passwordHash] = p }
        }
    }

    fun deleteUser(id: UUID) = transaction {
        Users.deleteWhere { Users.id eq id }
    }
}