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

fun Application.configureRouting() {
    val userRepository = UserRepository()

    routing {
        locationRoutes()
        itemRoutes()
        dslRoutes()
        userRoutes(userRepository)
        loanRoutes()

        get("/") {
            call.respondText("Hello, World!")
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
