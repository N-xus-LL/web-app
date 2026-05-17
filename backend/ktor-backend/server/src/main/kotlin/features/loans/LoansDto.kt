@file:OptIn(ExperimentalUuidApi::class)

package nexus.features.loans

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName
import kotlinx.serialization.json.JsonElement
import kotlin.time.Instant
import kotlin.uuid.Uuid
import kotlin.uuid.ExperimentalUuidApi

@Serializable
data class CreateLoanRequest(
    val itemId: Uuid,
    val lenderId: Uuid,
    val borrowerId: Uuid,
    val startDate: Instant? = null,
    val expectedReturnDate: Instant? = null,
    val notes: String? = null,
    val metadata: JsonElement? = null
)

@Serializable
data class UpdateLoanRequest(
    val status: String? = null,
    val agreedDamagePolicyId: String? = null,
    val actualReturnDate: Instant? = null,
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
    val status: String,
    val agreedDamagePolicyId: String?,
    val startDate: Instant?,
    val expectedReturnDate: Instant?,
    val actualReturnDate: Instant?,
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
