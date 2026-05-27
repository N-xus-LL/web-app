package nexus.features.loans

// Reference Tables
import nexus.features.items.Items
import nexus.features.items.data.ItemConditions
import nexus.features.users.Users
import features.loans.data.LoanStatuses

// Specialized Types – Dates, JSON & UUID
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import nexus.features.items.data.DamagePolicies
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.dao.id.UuidTable
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.json.jsonb
import org.jetbrains.exposed.v1.datetime.*
import kotlin.uuid.ExperimentalUuidApi
@OptIn(ExperimentalUuidApi::class)

object Loans : UuidTable("loans") {
    val itemId = uuid("item_id").references(Items.id, onDelete = ReferenceOption.CASCADE)
    val lenderId = uuid("lender_id").references(Users.id, onDelete = ReferenceOption.CASCADE)
    val borrowerId = uuid("borrower_id").references(Users.id, onDelete = ReferenceOption.CASCADE)
    // val lenderId = uuid("lender_id").references(Users.id, onDelete = ReferenceOption.SET_NULL).nullable()
    // val borrowerId = uuid("borrower_id").references(Users.id, onDelete = ReferenceOption.SET_NULL).nullable()

    val status = text("status").references(LoanStatuses.id)
    val agreedDamagePolicyId = text("agreed_damage_policy_id").references(DamagePolicies.id).nullable()

    val startDate = datetime("start_date").defaultExpression(CurrentDateTime).nullable()
    val expectedReturnDate = datetime("expected_return_date").nullable()
    val actualReturnDate = datetime("actual_return_date").nullable()

    val conditionOnBorrowId = text("condition_on_borrow_id").references(ItemConditions.id).nullable()
    val conditionOnReturnId = text("condition_on_return_id").references(ItemConditions.id).nullable()

    val notes = text("notes").nullable()
    val metadata = jsonb<JsonElement>("metadata", Json.Default)

    init {
        check("different_parties") { lenderId neq borrowerId }
    }
}