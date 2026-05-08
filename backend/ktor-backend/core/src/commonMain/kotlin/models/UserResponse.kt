package nexus.models

import kotlinx.serialization.Serializable

@Serializable
data class UserResponse(
    val email: String,
    val username: String
)