@file:OptIn(ExperimentalUuidApi::class)

package nexus.features.loans

import io.ktor.http.HttpStatusCode
import io.ktor.server.request.ContentTransformationException
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route
import nexus.util.errorResponse
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

fun Route.loanRoutes() {
    val loansService = LoansService()

    route("/api/loans") {

        // Create a new loan
        post {
            try {
                val request = call.receive<CreateLoanRequest>()
                val loan = loansService.createLoan(request)
                call.respond(HttpStatusCode.Created, loan)
            } catch (e: Exception) {
                // Log the actual error to the server console!
                e.printStackTrace()
                // Send the real message back to the client temporarily for debugging
                call.respond(HttpStatusCode.InternalServerError, mapOf("debug_error" to e.message))
            }
        }

        // Get all loans
        get {
            try {
                val loans = loansService.getAllLoans()
                call.respond(HttpStatusCode.OK, loans)
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, errorResponse("Failed to fetch loans."))
            }
        }

        // Get loans by borrower
        get("/borrows/{borrowerId}") {
            val borrowerId = call.parameters["borrowerId"]?.let { Uuid.parse(it) }
            if (borrowerId == null) {
                call.respond(HttpStatusCode.BadRequest, errorResponse("Invalid borrower ID."))
                return@get
            }

            try {
                val loans = loansService.getLoansByBorrower(borrowerId)
                call.respond(HttpStatusCode.OK, loans)
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, errorResponse("Failed to fetch loans."))
            }
        }

        // Get loans by lender
        get("/lendings/{lenderId}") {
            val lenderId = call.parameters["lenderId"]?.let { Uuid.parse(it) }
            if (lenderId == null) {
                call.respond(HttpStatusCode.BadRequest, errorResponse("Invalid lender ID."))
                return@get
            }

            try {
                val loans = loansService.getLoansByLender(lenderId)
                call.respond(HttpStatusCode.OK, loans)
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, errorResponse("Failed to fetch loans."))
            }
        }

        // Get specific loan by ID
        get("/{loanId}") {
            val loanIdParam = call.parameters["loanId"]?.let { Uuid.parse(it) }
            if (loanIdParam == null) {
                call.respond(HttpStatusCode.BadRequest, errorResponse("Invalid loan ID."))
                return@get
            }

            try {
                val loanId = EntityID(loanIdParam, Loans) // Convert Uuid to EntityID<Uuid>
                val loan = loansService.getLoanById(loanId)

                if (loan != null) {
                    call.respond(HttpStatusCode.OK, loan)
                } else {
                    call.respond(HttpStatusCode.NotFound, errorResponse("Loan not found."))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, errorResponse("Failed to fetch loan."))
            }
        }

        // Update a loan
        put("/{loanId}") {
            val loanId = call.parameters["loanId"]?.let { runCatching { Uuid.parse(it) }.getOrNull() }
                ?: return@put call.respond(HttpStatusCode.BadRequest, errorResponse("Invalid request body."))

            val request = try {
                call.receive<UpdateLoanRequest>()
            } catch (e: ContentTransformationException) {
                return@put call.respond(HttpStatusCode.BadRequest, errorResponse("Invalid request body."))
            }

            try {
                val updated = loansService.updateLoan(EntityID(loanId, Loans), request)
                if (updated != null) {
                    call.respond(HttpStatusCode.OK, updated)
                } else {
                    call.respond(HttpStatusCode.NotFound, errorResponse("Loan not found."))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, errorResponse("Failed to update loan."))
            }
        }

        // Return an item / Complete a loan
        post("/{loanId}/return") {
            val loanIdParam = call.parameters["loanId"]?.let { Uuid.parse(it) }
            if (loanIdParam == null) {
                call.respond(HttpStatusCode.BadRequest, errorResponse("Invalid loan ID."))
                return@post
            }

            try {
                val loanId = EntityID(loanIdParam, Loans) // Convert Uuid to EntityID<Uuid>
                val request = call.receive<Map<String, String>>()
                val conditionOnReturnId = request["conditionOnReturnId"]

                if (conditionOnReturnId == null) {
                    call.respond(HttpStatusCode.BadRequest, errorResponse("Condition on return ID is required."))
                    return@post
                }

                val returnedLoan = loansService.returnLoan(loanId, conditionOnReturnId)
                if (returnedLoan != null) {
                    call.respond(HttpStatusCode.OK, returnedLoan)
                } else {
                    call.respond(HttpStatusCode.NotFound, errorResponse("Loan not found."))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, errorResponse("Failed to return loan."))
            }
        }

        // Cancel a loan
        post("/{loanId}/cancel") {
            val loanId = call.parameters["loanId"]?.let { Uuid.parse(it) }
            if (loanId == null) {
                call.respond(HttpStatusCode.BadRequest, errorResponse("Invalid loan ID."))
                return@post
            }

            try {
                val cancelled = loansService.cancelLoan(loanId)
                if (cancelled) {
                    call.respond(HttpStatusCode.OK, mapOf("message" to "Loan cancelled successfully."))
                } else {
                    call.respond(HttpStatusCode.NotFound, errorResponse("Loan not found."))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, errorResponse("Failed to cancel loan."))
            }
        }

        // Delete a loan
        delete("/{loanId}") {
            val loanId = call.parameters["loanId"]?.let { Uuid.parse(it) }
            if (loanId == null) {
                call.respond(HttpStatusCode.BadRequest, errorResponse("Invalid loan ID."))
                return@delete
            }

            try {
                val deleted = loansService.deleteLoan(loanId)
                if (deleted) {
                    call.respond(HttpStatusCode.NoContent)
                } else {
                    call.respond(HttpStatusCode.NotFound, errorResponse("Loan not found."))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, errorResponse("Failed to delete loan."))
            }
        }

    }
}
