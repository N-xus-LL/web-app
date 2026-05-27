package nexus.api.model

import kotlinx.serialization.Serializable

@Serializable
data class ItemConditions(
    val id: String,
    val name: String
)
