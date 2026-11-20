package nexus

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.resources.*
import nexus.repository.UserRepository
import nexus.routes.dslRoutes
import nexus.routes.itemRoutes
import nexus.routes.locationRoutes
import nexus.routes.userRoutes
import nexus.features.loans.loanRoutes
import nexus.features.lockers.lockerStationRoutes

fun Application.configureRouting() {
    val userRepository = UserRepository()

    routing {
        userRoutes(userRepository)
        locationRoutes()
        itemRoutes()
        loanRoutes()
        dslRoutes()
        lockerStationRoutes()

        get("/") {
            call.respondText("Hello, World!")
        }
        get("/health") {
            call.respond(mapOf("status" to "ok"))
        }
        get<Articles> { article ->
            // Get all articles ...
            call.respond("List of articles sorted starting from ${article.sort}")
        }
        get("/json/kotlinx-serialization") {
            call.respond(mapOf("hello" to "world"))
        }
    }
}
