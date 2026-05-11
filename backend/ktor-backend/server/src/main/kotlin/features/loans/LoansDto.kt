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
    @SerialName("item_id")
    val itemId: Uuid,

    @SerialName("lender_id")
    val lenderId: Uuid,

    @SerialName("borrower_id")
    val borrowerId: Uuid,

    @SerialName("start_date")
    val startDate: Instant? = null,

    @SerialName("expected_return_date")
    val expectedReturnDate: Instant? = null,

    val notes: String? = null,
    val metadata: JsonElement? = null
)

@Serializable
data class UpdateLoanRequest(
    @SerialName("status")
    val loanStatus: String? = null,

    @SerialName("agreed_damage_policy_id")
    val agreedDamagePolicyId: String? = null,

    @SerialName("actual_return_date")
    val actualReturnDate: Instant? = null,

    @SerialName("condition_on_return_id")
    val conditionOnReturnId: String? = null,

    val notes: String? = null,
    val metadata: JsonElement? = null
)

@Serializable
data class LoanResponse(
    val id: Uuid,

    @SerialName("item_id")
    val itemId: Uuid,

    @SerialName("lender_id")
    val lenderId: Uuid,

    @SerialName("borrower_id")
    val borrowerId: Uuid,

    @SerialName("status")
    val loanStatus: String,

    @SerialName("agreed_damage_policy_id")
    val agreedDamagePolicyId: String?,

    @SerialName("start_date")
    val startDate: Instant?,

    @SerialName("expected_return_date")
    val expectedReturnDate: Instant?,

    @SerialName("actual_return_date")
    val actualReturnDate: Instant?,

    @SerialName("condition_on_borrow_id")
    val conditionOnBorrowId: String?,

    @SerialName("condition_on_return_id")
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
