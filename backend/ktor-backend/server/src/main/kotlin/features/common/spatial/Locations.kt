package features.common.spatial

import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.dao.id.UuidTable
import org.jetbrains.exposed.v1.json.jsonb
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlin.uuid.ExperimentalUuidApi

@OptIn(ExperimentalUuidApi::class)
object Locations : UuidTable("locations") {
    val localityId = uuid("locality_id")
    val location   = point("location")
    val locationType = text("location_type")
    val address    = text("address")
    val sourceId   = text("source_id").default("manual")
    val metadata   = jsonb<JsonElement>("metadata", Json.Default)
}