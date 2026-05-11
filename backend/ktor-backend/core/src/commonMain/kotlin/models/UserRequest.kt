package nexus.models

import kotlinx.serialization.Serializable

@Serializable
data class UserRequest(
    val email: String,
    val username: String,
    val firstName: String,
    val lastName: String,
    val password: String
)