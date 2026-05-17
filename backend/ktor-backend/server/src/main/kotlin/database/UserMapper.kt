@file:OptIn(ExperimentalUuidApi::class)

package nexus.database

import nexus.database.tables.Users
import org.jetbrains.exposed.v1.core.ResultRow
import kotlin.uuid.ExperimentalUuidApi

fun ResultRow.toUser() = UserEntity(
    id = this[Users.id].value,
    username = this[Users.username],
    email = this[Users.email],
    passwordHash = this[Users.passwordHash],
    firstName = this[Users.firstName],
    lastName = this[Users.lastName],
    currentLocation = this[Users.currentLocation],
    createdAt = this[Users.createdAt],
    updatedAt = this[Users.updatedAt]
)

fun UserEntity.toSummaryResponse() = UserSummaryResponse(
    id = this.id ?: throw IllegalStateException("User ID cannot be null for saved domain data"),
    username = this.username,
    firstName = this.firstName,
    lastName = this.lastName
)

fun UserEntity.toDetailedResponse() = UserDetailedResponse(
    id = this.id ?: throw IllegalStateException("User ID cannot be null for saved domain data"),
    username = this.username,
    email = this.email,
    firstName = this.firstName,
    lastName = this.lastName,
    currentLocation = this.currentLocation,
    createdAt = this.createdAt,
    updatedAt = this.updatedAt
)