package nexus.models

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String? = null,
    val username: String? = null,
    val password: String
)
