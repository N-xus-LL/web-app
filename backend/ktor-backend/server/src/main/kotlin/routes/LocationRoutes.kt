package nexus.routes

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.request.receiveText
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.SerializationException
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNamingStrategy
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import nexus.api.model.LocationRequest
import nexus.database.toResponse
import nexus.database.toLocation
import nexus.database.LocationEntity
import nexus.repository.LocationRepository
import java.util.UUID

fun Route.locationRoutes() {
    val locationRepository = LocationRepository()

    route("/locations") {
        get {
            val locations = locationRepository.getLocations()
            val response = locations.map { it.toResponse() }
            call.respond(HttpStatusCode.OK, response)
        }

        get("/{id}") {
            val id = call.parameters["id"] ?: run {
                call.respond(HttpStatusCode.BadRequest, "Invalid id")
                return@get
            }

            val loc = locationRepository.getLocationById(UUID.fromString(id))
            if (loc != null) call.respond(HttpStatusCode.OK, loc.toResponse())
            else call.respond(HttpStatusCode.NotFound, "Location not found")
        }

        post {
            val body = call.receiveLocationRequest()
            val entity = LocationEntity(
                name = body.name,
                locationType = body.locationType,
                location = body.location,
                source = body.source,
                metadata = kotlinx.serialization.json.Json.encodeToString(kotlinx.serialization.json.JsonObject.serializer(), body.metadata)
            )

            val created = locationRepository.createLocation(entity)
            call.respond(HttpStatusCode.Created, created.toResponse())
        }

        put {
            val body = call.receiveLocationRequest()
            // expecting id present in query or body is not defined in request; for simplicity require id in query param
            val idParam = call.request.queryParameters["id"]
            if (idParam == null) {
                call.respond(HttpStatusCode.BadRequest, "Missing id query parameter")
                return@put
            }

            val entity = LocationEntity(
                id = UUID.fromString(idParam),
                name = body.name,
                locationType = body.locationType,
                location = body.location,
                source = body.source,
                metadata = kotlinx.serialization.json.Json.encodeToString(kotlinx.serialization.json.JsonObject.serializer(), body.metadata)
            )

            val updated = locationRepository.updateLocation(entity)
            if (updated) call.respond(HttpStatusCode.OK, "Location updated")
            else call.respond(HttpStatusCode.NotFound, "Location not found")
        }

        delete("/{id}") {
            val id = call.parameters["id"] ?: run {
                call.respond(HttpStatusCode.BadRequest, "Invalid id")
                return@delete
            }

            val deleted = locationRepository.deleteLocation(UUID.fromString(id))
            if (deleted) call.respond(HttpStatusCode.NoContent)
            else call.respond(HttpStatusCode.NotFound, "Location not found")
        }
    }
}

private suspend fun ApplicationCall.receiveLocationRequest(): LocationRequest {
    val text = receiveText()
    val json = Json {
        ignoreUnknownKeys = true
        namingStrategy = JsonNamingStrategy.SnakeCase
    }

    return try {
        json.decodeFromString(text)
    } catch (first: SerializationException) {
        val fixed = normalizeRequestKeys(json.parseToJsonElement(text))
        json.decodeFromString(fixed.toString())
    }
}

private fun normalizeRequestKeys(element: JsonElement): JsonElement {
    if (element !is JsonObject) return element

    return buildJsonObject {
        for ((key, value) in element) {
            when (key) {
                "locationType" -> put("location_type", value)
                else -> put(key, value)
            }
        }
    }
}
