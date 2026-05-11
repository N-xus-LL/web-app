package nexus.utils

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject

private val json = Json { ignoreUnknownKeys = true }

fun parseMetadata(value: String): JsonObject {
    return json.parseToJsonElement(value).jsonObject
}