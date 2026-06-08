package nexus.database

import nexus.models.GeoPoint
import java.math.BigDecimal
import java.util.UUID
import java.time.Instant

class ItemEntity (
    val id: UUID? = null,
    val owner_id: UUID,
    val category_id: UUID?,
    val condition_id: String?,
    val default_damage_policy_id: String?,
    val name: String,
    val description: String?,
    val images: List<String>,
    val currentLocation: GeoPoint,
    val available: Boolean,
    val weight: Double,
    val length: Double,
    val width: Double,
    val height: Double,
    val estimatedValue: BigDecimal?,
    val metadata: String,
    val createdAt: Instant,
    val updatedAt: Instant
)