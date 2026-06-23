@file:OptIn(ExperimentalUuidApi::class)

package nexus.database

import features.common.spatial.GeoJsonPoint
import kotlin.time.Instant
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

class UserEntity (
    val id: Uuid? = null,
    val username: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val passwordHash: String,
    val currentLocation: GeoJsonPoint?,
    val createdAt: Instant,
    val updatedAt: Instant
)
