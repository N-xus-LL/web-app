package nexus.features.items.data

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.json.jsonb

import kotlin.uuid.Uuid
import kotlin.uuid.ExperimentalUuidApi
@OptIn(ExperimentalUuidApi::class)

object Categories : Table("categories") {
    val id = uuid("id").clientDefault { Uuid.random() }
    val name = text("name").uniqueIndex()
    val description = text("description").nullable()
    val metadataSchema = jsonb<JsonElement>("metadata_schema", Json.Default)
    override val primaryKey = PrimaryKey(id)
}

object ItemConditions : Table("item_conditions") {
    val id = text("id")
    val name = text("name").uniqueIndex()
    override val primaryKey = PrimaryKey(id)
}

object DamagePolicies : Table("damage_policies") {
    val id = text("id")
    val name = text("name").uniqueIndex()
    val description = text("description").nullable()
    override val primaryKey = PrimaryKey(id)
}