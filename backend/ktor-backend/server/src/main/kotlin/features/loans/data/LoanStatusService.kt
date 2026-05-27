package nexus.features.loans.data

import features.loans.data.LoanStatuses
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.core.eq
import kotlinx.serialization.Serializable

@Serializable
data class LoanStatusInfo(
    val id: String,
    val name: String
)

class LoanStatusService {

    fun getStatusInfo(statusId: String): LoanStatusInfo? = transaction {
        LoanStatuses
            .selectAll()
            .where { LoanStatuses.id eq statusId }
            .map { row ->
                LoanStatusInfo(
                    id = row[LoanStatuses.id],
                    name = row[LoanStatuses.name]
                    // displayOrder = row[LoanStatuses.displayOrder]
                )
            }
            .singleOrNull()
    }

    fun getAllStatuses(): List<LoanStatusInfo> = transaction {
        LoanStatuses
            .selectAll()
            // .orderBy(LoanStatuses.displayOrder to org.jetbrains.exposed.v1.core.SortOrder.ASC)
            .map { row ->
                LoanStatusInfo(
                    id = row[LoanStatuses.id],
                    name = row[LoanStatuses.name]
                    // displayOrder = row[LoanStatuses.displayOrder]
                )
            }
    }

    fun validateStatusExists(statusId: String): Boolean = transaction {
        LoanStatuses
            .selectAll()
            .where { LoanStatuses.id eq statusId }
            .any()
    }
}