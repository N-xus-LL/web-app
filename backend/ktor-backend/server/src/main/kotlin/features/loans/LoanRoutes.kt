@file:OptIn(ExperimentalUuidApi::class)

package nexus.features.loans

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route
import io.ktor.server.routing.routing
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

fun Application.registerLoansRoutes(loansService: LoansService) {
    routing {
        route("/api/loans") {

            // Create a new loan
            post {
                try {
                    val request = call.receive<CreateLoanRequest>()
                    val loan = loansService.createLoan(request)
                    call.respond(HttpStatusCode.Created, loan)
                } catch (e: IllegalArgumentException) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to e.message))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to create loan"))
                }
            }

            // Get all loans
            get {
                try {
                    val loans = loansService.getAllLoans()
                    call.respond(HttpStatusCode.OK, loans)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch loans"))
                }
            }

            // Get loans by borrower
            get("/borrower/{borrowerId}") {
                val borrowerId = call.parameters["borrowerId"]?.let { Uuid.parse(it) }
                if (borrowerId == null) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid borrower ID"))
                    return@get
                }

                try {
                    val loans = loansService.getLoansByBorrower(borrowerId)
                    call.respond(HttpStatusCode.OK, loans)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch loans"))
                }
            }

            // Get loans by lender
            get("/lender/{lenderId}") {
                val lenderId = call.parameters["lenderId"]?.let { Uuid.parse(it) }
                if (lenderId == null) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid lender ID"))
                    return@get
                }

                try {
                    val loans = loansService.getLoansByLender(lenderId)
                    call.respond(HttpStatusCode.OK, loans)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch loans"))
                }
            }

            // Get specific loan by ID
            get("/{loanId}") {
                val loanId = call.parameters["loanId"]?.let { Uuid.parse(it) }
                if (loanId == null) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid loan ID"))
                    return@get
                }

                try {
                    val loan = loansService.getLoanById(loanId)
                    if (loan != null) {
                        call.respond(HttpStatusCode.OK, loan)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Loan not found"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to fetch loan"))
                }
            }

            // Update a loan
            put("/{loanId}") {
                val loanId = call.parameters["loanId"]?.let { Uuid.parse(it) }
                if (loanId == null) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid loan ID"))
                    return@put
                }

                try {
                    val request = call.receive<UpdateLoanRequest>()
                    val updatedLoan = loansService.updateLoan(loanId, request)
                    if (updatedLoan != null) {
                        call.respond(HttpStatusCode.OK, updatedLoan)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Loan not found"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update loan"))
                }
            }

            // Return a loan (complete it)
            post("/{loanId}/return") {
                val loanId = call.parameters["loanId"]?.let { Uuid.parse(it) }
                if (loanId == null) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid loan ID"))
                    return@post
                }

                try {
                    val request = call.receive<Map<String, String>>()
                    val conditionOnReturnId = request["conditionOnReturnId"]
                    if (conditionOnReturnId == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Condition on return ID is required"))
                        return@post
                    }

                    val returnedLoan = loansService.returnLoan(loanId, conditionOnReturnId)
                    if (returnedLoan != null) {
                        call.respond(HttpStatusCode.OK, returnedLoan)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Loan not found"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to return loan"))
                }
            }

            // Cancel a loan
            post("/{loanId}/cancel") {
                val loanId = call.parameters["loanId"]?.let { Uuid.parse(it) }
                if (loanId == null) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid loan ID"))
                    return@post
                }

                try {
                    val cancelled = loansService.cancelLoan(loanId)
                    if (cancelled) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Loan cancelled successfully"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Loan not found"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to cancel loan"))
                }
            }

            // Delete a loan
            delete("/{loanId}") {
                val loanId = call.parameters["loanId"]?.let { Uuid.parse(it) }
                if (loanId == null) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid loan ID"))
                    return@delete
                }

                try {
                    val deleted = loansService.deleteLoan(loanId)
                    if (deleted) {
                        call.respond(HttpStatusCode.NoContent)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Loan not found"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete loan"))
                }
            }
        }
    }
}
