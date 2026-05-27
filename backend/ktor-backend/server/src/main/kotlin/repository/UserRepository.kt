@file:OptIn(ExperimentalUuidApi::class)

package nexus.repository

import features.common.spatial.GeoJsonPoint
import nexus.auth.AuthService
import nexus.database.tables.Users
import nexus.database.toUser
import nexus.database.UserEntity
import nexus.domain.exceptions.*

import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.core.*
import kotlin.uuid.Uuid
import kotlin.uuid.ExperimentalUuidApi

class UserRepository {

    fun getUsers(condition: (() -> Op<Boolean>)? = null) = transaction {
        val query = Users.selectAll()
        if (condition != null) query.where(condition)
        query.map { it.toUser() }
    }

    fun getUserById( id: Uuid ) = transaction { getUsers { Users.id eq id }.firstOrNull() }

    fun getUserByUsername( username: String ) = transaction { getUsers { Users.username eq username }.firstOrNull() }

    fun getUserByEmail( email: String ) = transaction { getUsers { Users.email eq email }.firstOrNull() }

    fun createUser(email: String, username: String, firstName: String,
                   lastName: String, passwordHash: String): UserEntity? {
        transaction {
            Users.insert {
                it[Users.email] = email
                it[Users.username] = username
                it[Users.firstName] = firstName
                it[Users.lastName] = lastName
                it[Users.passwordHash] = passwordHash
            }
        }

        return getUserByUsername(username)
    }

    /**
     * Updates cosmetic user details (First/Last Names)
     */
    fun updateProfile(id: Uuid, firstName: String?, lastName: String?) = transaction {
        val rowsUpdated = Users.update({ Users.id eq id }) {
            firstName?.let { f -> it[Users.firstName] = f }
            lastName?.let { l -> it[Users.lastName] = l }
        }

        if (rowsUpdated == 0) throw UserNotFoundException()
    }

    /**
     * Updates account identity fields with uniqueness guarantees inside the transaction block
     */
    fun updateIdentity(id: Uuid, username: String?, email: String?) = transaction {
        // Enforce entity presence check first
        val existingUser = getUserById(id) ?: throw UserNotFoundException()

        val cleanUsername = username?.trim()
        val cleanEmail = email?.trim()?.lowercase()

        // Verify username uniqueness if it's changing
        if (cleanUsername != null && cleanUsername != existingUser.username) {
            if (getUserByUsername(cleanUsername) != null) throw UsernameConflictException()
        }

        // Verify email uniqueness if it's changing
        if (cleanEmail != null && cleanEmail != existingUser.email) {
            if (getUserByEmail(cleanEmail) != null) throw EmailConflictException()
        }

        Users.update({ Users.id eq id }) {
            cleanUsername?.let { u -> it[Users.username] = u }
            cleanEmail?.let { e -> it[Users.email] = e }
        }
    }

    /**
     * Password matching, secure verification, and re-hashing
     */
    fun updatePassword(id: Uuid, oldPasswordRaw: String, newPasswordRaw: String) = transaction {
        val user = getUserById(id) ?: throw UserNotFoundException()

        // Perform security verification check inside data layer
        if (!AuthService.verifyPassword(oldPasswordRaw, user)) {
            throw IncorrectPasswordException()
        }

        // Hash new password and update in database
        val newPasswordHashed = AuthService.hashPassword(newPasswordRaw)
        Users.update({ Users.id eq id }) {
            it[Users.passwordHash] = newPasswordHashed
        }
    }

    /**
     * Updates a user's geographic coordinates.
     */
    fun updateLocation(id: Uuid, latitude: Double, longitude: Double) = transaction {
        val rowsUpdated = Users.update({ Users.id eq id }) {
            it[Users.currentLocation] = GeoJsonPoint(listOf(latitude, longitude))
        }

        if (rowsUpdated == 0) throw UserNotFoundException()
    }

    fun deleteUser(id: Uuid) = transaction {
        val rowsDeleted = Users.deleteWhere { Users.id eq id }
        if (rowsDeleted == 0) throw UserNotFoundException()
    }
}