@file:OptIn(ExperimentalUuidApi::class)

package nexus.database

import features.common.spatial.GeoJsonPoint
import kotlinx.serialization.Serializable
import kotlin.time.Instant
import kotlin.uuid.Uuid
import kotlin.uuid.ExperimentalUuidApi

// Used for POST /auth/register
@Serializable
data class UserRegisterRequest(
    val username: String,
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String
)

// Used for POST /auth/login
@Serializable
data class UserLoginRequest(
    val identifier: String, // Can accept either username or email
    val password: String
)

// Used when nesting basic user data inside items, loans, or auth confirmations
@Serializable
data class UserSummaryResponse(
    val id: Uuid,
    val username: String,
    val firstName: String,
    val lastName: String
)

// Used for GET /users/<username> (Detailed profile overview)
@Serializable
data class UserDetailedResponse(
    val id: Uuid,
    val username: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val currentLocation: GeoJsonPoint?,
    val createdAt: Instant,
    val updatedAt: Instant
)

// Standard encapsulation for JWT responses
@Serializable
data class AuthResponse(
    val token: String,
    val user: UserSummaryResponse
)

@Serializable
data class UpdateProfileRequest(
    val firstName: String? = null,
    val lastName: String? = null
)

@Serializable
data class UpdateIdentityRequest(
    val username: String? = null,
    val email: String? = null
)

@Serializable
data class UpdatePasswordRequest(
    val oldPassword: String,
    val newPassword: String
)

// Independent DTO for lightweight background coordinate syncs
@Serializable
data class UpdateLocationResponse(
    val latitude: Double,
    val longitude: Double
)
