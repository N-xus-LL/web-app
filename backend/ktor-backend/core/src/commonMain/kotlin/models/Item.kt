package nexus.models

import kotlinx.serialization.Serializable

@Serializable
data class Item(
    val id: Int? = null,
    val title: String,
    val price: String,
    val location: String,
    val link: String
)