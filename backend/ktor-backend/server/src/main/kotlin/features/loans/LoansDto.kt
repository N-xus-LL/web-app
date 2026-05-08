@file:OptIn(ExperimentalUuidApi::class)

package nexus.features.loans

import kotlinx.serialization.Serializable
import kotlinx.datetime.LocalDateTime
import kotlinx.serialization.json.JsonElement
import kotlin.uuid.Uuid
import kotlin.uuid.ExperimentalUuidApi

@Serializable
data class CreateLoanRequest(
    val itemId: Uuid,
    val lenderId: Uuid,
    val borrowerId: Uuid,
    val startDate: LocalDateTime? = null,
    val expectedReturnDate: LocalDateTime? = null,
    val notes: String? = null,
    val metadata: JsonElement? = null
)

@Serializable
data class UpdateLoanRequest(
    val loanStatus: String? = null,
    val agreedDamagePolicyId: String? = null,
    val actualReturnDate: LocalDateTime? = null,
    val conditionOnReturnId: String? = null,
    val notes: String? = null,
    val metadata: JsonElement? = null
)

@Serializable
data class LoanResponse(
    val id: Uuid,
    val itemId: Uuid,
    val lenderId: Uuid,
    val borrowerId: Uuid,
    val loanStatus: String,
    val agreedDamagePolicyId: String?,
    val startDate: LocalDateTime?,
    val expectedReturnDate: LocalDateTime?,
    val actualReturnDate: LocalDateTime?,
    val conditionOnBorrowId: String?,
    val conditionOnReturnId: String?,
    val notes: String?,
    val metadata: JsonElement?
)

@Serializable
data class LoanWithDetailsResponse(
    val loan: LoanResponse,
    val itemTitle: String?,
    val lenderName: String?,
    val borrowerName: String?
)
