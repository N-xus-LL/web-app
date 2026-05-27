package nexus.api.model

import kotlinx.serialization.Serializable

@Serializable
data class DamagePolicies(
    val id: String,
    val name: String,
    val description: String?
)