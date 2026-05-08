package nexus.features.loans

// 1. Referenced Tables
import nexus.features.items.Items
import nexus.features.items.data.ItemConditions
import nexus.features.users.Users
import features.loans.data.LoanStatuses

// 2. EXPOSED CORE & DSL

// Specialized Types –Dates and JSON
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import nexus.features.items.data.DamagePolicies
import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.json.jsonb
import org.jetbrains.exposed.v1.datetime.*

// UUID
import kotlin.uuid.Uuid
import kotlin.uuid.ExperimentalUuidApi
@OptIn(ExperimentalUuidApi::class)

object Loans : Table("loans") {
    val id = uuid("id").clientDefault { Uuid.random() }

    val itemId = uuid("item_id").references(Items.id, onDelete = ReferenceOption.CASCADE)
    val lenderId = uuid("lender_id").references(Users.id)
    val borrowerId = uuid("borrower_id").references(Users.id)

    val loan_status = text("loan_status").references(LoanStatuses.id)
    val agreedDamagePolicyId = text("agreed_damage_policy_id").references(DamagePolicies.id).nullable()

    val startDate = datetime("start_date").defaultExpression(CurrentDateTime).nullable()
    val expectedReturnDate = datetime("expected_return_date").nullable()
    val actualReturnDate = datetime("actual_return_date").nullable()

    val conditionOnBorrowId = text("condition_on_borrow_id").references(ItemConditions.id).nullable()
    val conditionOnReturnId = text("condition_on_return_id").references(ItemConditions.id).nullable()

    val notes = text("notes").nullable()
    val metadata = jsonb<JsonElement>("metadata", Json.Default)

    override val primaryKey = PrimaryKey(id)

    init {
        check("different_parties") { lenderId neq borrowerId }
    }
}