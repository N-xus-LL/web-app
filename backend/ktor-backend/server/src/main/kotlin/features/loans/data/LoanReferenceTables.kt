package features.loans.data

import org.jetbrains.exposed.v1.core.Table

object LoanStatuses : Table("loan_statuses") {
    val id = text("id") // e.g., "PENDING", "ACTIVE"
    val name = text("name").uniqueIndex()

    override val primaryKey = PrimaryKey(id)
}

enum class LoanStatusEnum(val id: String) {
    PENDING("pending"),
    ACTIVE("active"),
    OVERDUE("overdue"),
    COMPLETED("completed"),
    CANCELLED("cancelled"),
    REJECTED("rejected");

    companion object {
        fun fromId(id: String): LoanStatusEnum? = entries.find { it.id == id }
    }
}