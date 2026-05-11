package nexus.api.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class Categories(
    val id: String,
    val name: String,
    val description: String?,
    val metadata: JsonObject
)