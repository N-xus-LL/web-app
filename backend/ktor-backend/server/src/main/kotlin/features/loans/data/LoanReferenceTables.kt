package features.loans.data

import org.jetbrains.exposed.v1.core.Table

object LoanStatuses : Table("loan_statuses") {
    val id = text("id") // e.g., "BORROWING_REQUESTED", "ACTIVE"
    val name = text("name").uniqueIndex()

    override val primaryKey = PrimaryKey(id)
}

enum class LoanStatusEnum(val id: String) {
    BORROWING_REQUESTED("borrowing_requested"),
    TERMS_PROPOSED("terms_proposed"),
    AWAITING_PICKUP("awaiting_pickup"),
    ACTIVE("active"),
    RETURNED("returned"),
    OVERDUE("overdue"),
    COMPLETED("completed"),
    CANCELLED("cancelled"),
    REJECTED("rejected");

    companion object {
        fun fromId(id: String): LoanStatusEnum? = entries.find { it.id == id }
    }
}