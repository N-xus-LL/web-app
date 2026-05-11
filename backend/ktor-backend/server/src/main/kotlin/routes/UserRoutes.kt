package nexus.routes

//import UserRepository
import nexus.repository.UserRepository

import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import nexus.models.LoginRequest
import nexus.models.UserRequest
import java.util.UUID

fun Route.userRoutes(userRepository: UserRepository) {

    route("/users") {

        get {
            val users = userRepository.getAllUsers()
            call.respond(users)
        }

        post {
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

        post("/login") {
            val body = call.receive<LoginRequest>()
            val email = body.email
            val username = body.username

            val user = when {
                email != null -> userRepository.getUserByEmailAndPassword(email, body.password)
                username != null -> userRepository.getUserByUsernameAndPassword(username, body.password)
                else -> null
            }

            if (user == null) {
                call.respond(HttpStatusCode.Unauthorized, "Invalid credentials")
            } else {
                call.respond(user)
            }
        }

        get("/{id}") {
            val id = UUID.fromString(call.parameters["id"]!!)

            val user = userRepository.getUserById(id)

            if (user == null) {
                call.respond(HttpStatusCode.NotFound, "User not found")
            } else {
                call.respond(user)
            }
        }

//        get("/username/{username}") {
//            val username = call.parameters["username"]!!
//
//            val user = userRepository.getUserByUsername(username)
//
//            if (user == null) {
//                call.respond(HttpStatusCode.NotFound, "User not found")
//            } else {
//                call.respond(user)
//            }
//        }

        put("/{id}") {
            val id = UUID.fromString(call.parameters["id"]!!)
            val body = call.receive<UserRequest>()

            val rowsUpdated = userRepository.updateUser(
                id = id,
                username = body.username,
                firstName = body.firstName,
                lastName = body.lastName,
                passwordHash = body.password
            )

            if (rowsUpdated > 0) {
                call.respond(HttpStatusCode.OK, "User updated")
            } else {
                call.respond(HttpStatusCode.NotFound, "User not found")
            }
        }

        delete("/{id}") {
            val id = UUID.fromString(call.parameters["id"]!!)

            val rowsDeleted = userRepository.deleteUser(id)

            if (rowsDeleted > 0) {
                call.respond(HttpStatusCode.OK, "User deleted")
            } else {
                call.respond(HttpStatusCode.NotFound, "User not found")
            }
        }
    }
}