package nexus.routes

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.request.receive
import io.ktor.server.request.receiveText
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.ExperimentalSerializationApi
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
import nexus.database.LocationEntity
import nexus.database.toEntity
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

        get("/nearby") {
            val latitude = call.request.queryParameters["lat"]?.toDoubleOrNull()
            val longitude = call.request.queryParameters["lon"]?.toDoubleOrNull()
            val radius = call.request.queryParameters["radius"]?.toDoubleOrNull()

            if (latitude == null || longitude == null || radius == null) {
                call.respond(HttpStatusCode.BadRequest, "Invalid request, missing parameter")
                return@get
            }
            val locations = locationRepository.nearbyLocations(latitude, longitude, radius)
            val response = locations.map { it.toResponse() }
            call.respond(HttpStatusCode.OK, response)
        }

        get("/closest") {
            val latitude = call.request.queryParameters["lat"]?.toDoubleOrNull()
            val longitude = call.request.queryParameters["lon"]?.toDoubleOrNull()

            if (latitude == null || longitude == null) {
                call.respond(HttpStatusCode.BadRequest, "Invalid request, missing parameter")
                return@get
            }

            val loc = locationRepository.closestLocation(latitude, longitude)
            if (loc != null) call.respond(HttpStatusCode.OK, loc.toResponse())
            else call.respond(HttpStatusCode.NotFound, "Location not found")
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
            val location = call.receive<LocationRequest>()
            val created = locationRepository.createLocation(location.toEntity())
            call.respond(HttpStatusCode.Created, created.toResponse())
        }

        put {
            val location = call.receive<LocationRequest>()

            if (location.id == null) {
                call.respond(HttpStatusCode.BadRequest, "Invalid location id")
                return@put
            }

            val updated = locationRepository.updateLocation(location.toEntity())
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

@OptIn(ExperimentalSerializationApi::class)
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
