@file:OptIn(ExperimentalUuidApi::class)

package nexus.routes

import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import nexus.auth.AuthService
import nexus.database.UpdateIdentityRequest
import nexus.database.UserRegisterRequest
import nexus.database.UserLoginRequest
import nexus.database.UpdateLocationResponse // Named UpdateLocationResponse in your file, used here for coordinate syncs
import nexus.database.UpdatePasswordRequest
import nexus.database.UpdateProfileRequest
import nexus.database.toDetailedResponse
import nexus.database.toSummaryResponse
import nexus.domain.exceptions.EmailConflictException
import nexus.domain.exceptions.IncorrectPasswordException
import nexus.domain.exceptions.InvalidParamException
import nexus.domain.exceptions.UserNotFoundException
import nexus.domain.exceptions.UsernameConflictException
import nexus.repository.UserRepository
import kotlin.uuid.Uuid
import kotlin.uuid.ExperimentalUuidApi

fun Route.userRoutes(
    userRepository: UserRepository
) {
    val authService = AuthService(userRepository)

    route("/users") {

        get {
            // Read from the query string (e.g., /?view_type=grid)
            val viewType = call.request.queryParameters["view_type"]
                ?.takeIf { it.isNotBlank() }

            // GET /users - Returns a summarized view of all users
            if (viewType === null) {
                val users = userRepository.getUsers().map { it.toSummaryResponse() }
                call.respond(users)
            }

            // GET /users?view=summarized - Returns a summarized view of all users
            // GET /users?view=detailed - Returns a detailed view of all users
            try {
                when (viewType) {
                    "summarized" -> {
                        val users = userRepository.getUsers().map { it.toSummaryResponse() }
                        call.respond(users)
                    }
                    "detailed" -> {
                        val users = userRepository.getUsers().map { it.toDetailedResponse() }
                        call.respond(users)
                    }
                    else -> throw InvalidParamException("Invalid view type parameter")
                }
            } catch (e: InvalidParamException) {
                call.respond(HttpStatusCode.NotAcceptable, e.message ?: "Invalid parameter error occurred")
            } catch (e: Exception) {
                call.respond(HttpStatusCode.NotAcceptable, e.message ?: "Error occurred")
            }
        }

        // POST /users/register - Proxies account creation through the service layer to hash passwords safely
        post("/register") {
            val body = call.receive<UserRegisterRequest>()

            try {
                val registrationResult = authService.register(body)
                call.respond(HttpStatusCode.Created, registrationResult)
            } catch (e: Exception) {
                call.respond(HttpStatusCode.Conflict, e.message!!)
            }
        }

        // POST /users/login - Single-field identifier matching
        post("/login") {
            val body = call.receive<UserLoginRequest>()
            val authResponse = authService.authenticate(body)

            if (authResponse != null) call.respond(HttpStatusCode.OK, authResponse)
            else call.respond(HttpStatusCode.Unauthorized, "Invalid credentials")
        }

        route("/{id}") {

            // GET /users/{id} - Fetches detailed user information safely mapped
            get {
                val id = Uuid.parse(call.parameters["id"]!!)

                try {
                    val user = userRepository.getUserById(id)
                    call.respond(user!!.toDetailedResponse())
                } catch (e: UserNotFoundException) {
                    call.respond(HttpStatusCode.NotFound, e.message!!)
                }
            }

            // PATCH /users/{id}/profile – name, bio, avatar, and other profile modifications
            patch("/profile") {
                val id = Uuid.parse(call.parameters["id"]!!)
                val body = call.receive<UpdateProfileRequest>() // Mapped from DTOs

                try {
                    userRepository.updateProfile(id, body.firstName, body.lastName)
                    call.respond(HttpStatusCode.OK, "Profile updated successfully")
                } catch (e: UserNotFoundException) {
                    call.respond(HttpStatusCode.NotFound, e.message!!)
                }
            }

            // PATCH /users/{id}/identity – username/email modifications
            patch("/identity") {
                val id = Uuid.parse(call.parameters["id"]!!)
                val body = call.receive<UpdateIdentityRequest>()

                try {
                    userRepository.updateIdentity(id, body.username, body.email)
                    call.respond(HttpStatusCode.OK, "Identity details updated")
                } catch (e: UserNotFoundException) {
                    call.respond(HttpStatusCode.NotFound, e.message!!)
                } catch (e: UsernameConflictException) {
                    call.respond(HttpStatusCode.Conflict, e.message!!)
                } catch (e: EmailConflictException) {
                    call.respond(HttpStatusCode.Conflict, e.message!!)
                }
            }

            // PUT /users/{id}/password - password modification
            put("/password") {
                val id = Uuid.parse(call.parameters["id"]!!)
                val body = call.receive<UpdatePasswordRequest>()

                try {
                    userRepository.updatePassword(id, body.oldPassword, body.newPassword)
                    call.respond(HttpStatusCode.OK, "Password rotated safely")
                } catch (e: UserNotFoundException) {
                    call.respond(HttpStatusCode.NotFound, e.message!!)
                } catch (e: IncorrectPasswordException) {
                    call.respond(HttpStatusCode.Unauthorized, e.message!!)
                }
            }

            // PATCH /users/{id}/location - Automated telemetric background syncing
            patch("/location") {
                val id = Uuid.parse(call.parameters["id"]!!)
                val body = call.receive<UpdateLocationResponse>()

                try {
                    userRepository.updateLocation(id, body.latitude, body.longitude)
                    call.respond(HttpStatusCode.OK, "Coordinates synchronized")
                } catch (e: UserNotFoundException) {
                    call.respond(HttpStatusCode.NotFound, e.message!!)
                }
            }

            // DELETE /users/{id}
            delete {
                val id = Uuid.parse(call.parameters["id"]!!)
                try {
                    userRepository.deleteUser(id)
                    call.respond(HttpStatusCode.OK, "User deleted successfully")
                } catch (e: UserNotFoundException) {
                    call.respond(HttpStatusCode.NotFound, e.message!!)
                }
            }

        }
    }
}