package nexus.routes

import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import nexus.repository.UserRepository
import nexus.models.UserRequest

fun Route.userRoutes(userRepository: UserRepository) {

    route("/users") {

        post("/register") {
            val body = call.receive<UserRequest>()

            userRepository.createUser(
                email = body.email,
                username = body.username,
                firstName = body.firstName,
                lastName = body.lastName,
                passwordHash = body.password
            )

            call.respond(HttpStatusCode.Created, "User created")
        }

        get("/{email}") {
            val email = call.parameters["email"]!!

            val user = userRepository.getUserByEmail(email)

            if (user == null) {
                call.respond(HttpStatusCode.NotFound, "User not found")
            } else {
                call.respond(user)
            }
        }
    }
}