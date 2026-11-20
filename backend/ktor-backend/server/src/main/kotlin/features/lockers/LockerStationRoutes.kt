package nexus.features.lockers

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import kotlin.uuid.Uuid
import kotlin.uuid.ExperimentalUuidApi

fun Route.lockerStationRoutes() {
    val service = LockerStationService()

    route("/locker-stations") {
        get {
            val availableOnly = call.request.queryParameters["available_only"]
                ?.toBooleanStrictOrNull() ?: false
            call.respond(HttpStatusCode.OK, service.getLockerStations(availableOnly))
        }

        get("/{id}") {
            val id = call.parameters["id"]?.let { runCatching { Uuid.parse(it) }.getOrNull() }
                ?: return@get call.respond(HttpStatusCode.BadRequest, "Invalid id")

            val detail = service.getLockerStationById(id)
                ?: return@get call.respond(HttpStatusCode.NotFound, "Locker station not found")

            call.respond(HttpStatusCode.OK, detail)
        }
    }
}