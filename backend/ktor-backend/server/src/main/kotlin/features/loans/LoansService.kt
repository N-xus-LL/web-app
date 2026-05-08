@file:OptIn(ExperimentalUuidApi::class)

package nexus.features.loans
import features.loans.data.LoanStatusEnum
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.core.eq
import kotlin.uuid.Uuid
import kotlin.time.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import nexus.features.users.Users
import nexus.features.items.Items
import kotlin.uuid.ExperimentalUuidApi

class LoansService {

    fun createLoan(request: CreateLoanRequest): LoanResponse = transaction {
        // Validate that item exists
        val itemExists = Items
            .selectAll()
            .where { Items.id eq request.itemId }
            .any()

        if (!itemExists) {
            throw IllegalArgumentException("Item not found with id: ${request.itemId}")
        }

        // Validate lender and borrower exist
        val lenderExists = Users
            .selectAll()
            .where { Users.id eq request.lenderId }
            .any()

        if (!lenderExists) {
            throw IllegalArgumentException("Lender not found")
        }

        val borrowerExists = Users
            .selectAll()
            .where { Users.id eq request.borrowerId }
            .any()

        if (!borrowerExists) {
            throw IllegalArgumentException("Borrower not found")
        }

        val loanId = Loans.insert {
            it[id] = Uuid.random()
            it[itemId] = request.itemId
            it[lenderId] = request.lenderId
            it[borrowerId] = request.borrowerId
            it[loan_status] = LoanStatusEnum.PENDING.id
            it[startDate] = request.startDate
            it[expectedReturnDate] = request.expectedReturnDate
            it[notes] = request.notes
            it[metadata] = request.metadata!!
            it[conditionOnBorrowId] = null
            it[agreedDamagePolicyId] = null
            it[actualReturnDate] = null
            it[conditionOnReturnId] = null
        } get Loans.id

        getLoanById(loanId) ?: throw IllegalStateException("Failed to create loan")
    }

    fun getLoanById(loanId: Uuid): LoanResponse? = transaction {
        Loans
            .selectAll()
            .where { Loans.id eq loanId }
            .mapNotNull { row ->
                LoanResponse(
                    id = row[Loans.id],
                    itemId = row[Loans.itemId],
                    lenderId = row[Loans.lenderId],
                    borrowerId = row[Loans.borrowerId],
                    loanStatus = row[Loans.loan_status],
                    agreedDamagePolicyId = row[Loans.agreedDamagePolicyId],
                    startDate = row[Loans.startDate],
                    expectedReturnDate = row[Loans.expectedReturnDate],
                    actualReturnDate = row[Loans.actualReturnDate],
                    conditionOnBorrowId = row[Loans.conditionOnBorrowId],
                    conditionOnReturnId = row[Loans.conditionOnReturnId],
                    notes = row[Loans.notes],
                    metadata = row[Loans.metadata]
                )
            }
            .singleOrNull()
    }

    fun getAllLoans(): List<LoanResponse> = transaction {
        Loans
            .selectAll()
            .map { row ->
                LoanResponse(
                    id = row[Loans.id],
                    itemId = row[Loans.itemId],
                    lenderId = row[Loans.lenderId],
                    borrowerId = row[Loans.borrowerId],
                    loanStatus = row[Loans.loan_status],
                    agreedDamagePolicyId = row[Loans.agreedDamagePolicyId],
                    startDate = row[Loans.startDate],
                    expectedReturnDate = row[Loans.expectedReturnDate],
                    actualReturnDate = row[Loans.actualReturnDate],
                    conditionOnBorrowId = row[Loans.conditionOnBorrowId],
                    conditionOnReturnId = row[Loans.conditionOnReturnId],
                    notes = row[Loans.notes],
                    metadata = row[Loans.metadata]
                )
            }
    }

    fun getLoansByBorrower(borrowerId: Uuid): List<LoanResponse> = transaction {
        Loans
            .selectAll()
            .where { Loans.borrowerId eq borrowerId }
            .map { row ->
                LoanResponse(
                    id = row[Loans.id],
                    itemId = row[Loans.itemId],
                    lenderId = row[Loans.lenderId],
                    borrowerId = row[Loans.borrowerId],
                    loanStatus = row[Loans.loan_status],
                    agreedDamagePolicyId = row[Loans.agreedDamagePolicyId],
                    startDate = row[Loans.startDate],
                    expectedReturnDate = row[Loans.expectedReturnDate],
                    actualReturnDate = row[Loans.actualReturnDate],
                    conditionOnBorrowId = row[Loans.conditionOnBorrowId],
                    conditionOnReturnId = row[Loans.conditionOnReturnId],
                    notes = row[Loans.notes],
                    metadata = row[Loans.metadata]
                )
            }
    }

    fun getLoansByLender(lenderId: Uuid): List<LoanResponse> = transaction {
        Loans
            .selectAll()
            .where { Loans.lenderId eq lenderId }
            .map { row ->
                LoanResponse(
                    id = row[Loans.id],
                    itemId = row[Loans.itemId],
                    lenderId = row[Loans.lenderId],
                    borrowerId = row[Loans.borrowerId],
                    loanStatus = row[Loans.loan_status],
                    agreedDamagePolicyId = row[Loans.agreedDamagePolicyId],
                    startDate = row[Loans.startDate],
                    expectedReturnDate = row[Loans.expectedReturnDate],
                    actualReturnDate = row[Loans.actualReturnDate],
                    conditionOnBorrowId = row[Loans.conditionOnBorrowId],
                    conditionOnReturnId = row[Loans.conditionOnReturnId],
                    notes = row[Loans.notes],
                    metadata = row[Loans.metadata]
                )
            }
    }

    fun updateLoan(loanId: Uuid, request: UpdateLoanRequest): LoanResponse? = transaction {
        val existingLoan = getLoanById(loanId)

        existingLoan?.let {
            Loans.update({ Loans.id eq loanId }) {
                request.loanStatus?.let { status -> it[loan_status] = status }
                request.agreedDamagePolicyId?.let { policyId -> it[agreedDamagePolicyId] = policyId }
                request.actualReturnDate?.let { returnDate -> it[actualReturnDate] = returnDate }
                request.conditionOnReturnId?.let { conditionId -> it[conditionOnReturnId] = conditionId }
                request.notes?.let { note -> it[notes] = note }
                request.metadata?.let { meta -> it[metadata] = meta }
            }

            getLoanById(loanId)
        }
    }

    fun returnLoan(loanId: Uuid, condOnReturnId: String): LoanResponse? = transaction {
        val now = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault())

        Loans.update(where = { Loans.id eq loanId }) {
            it[actualReturnDate] = now
            it[conditionOnReturnId] = condOnReturnId
            it[loan_status] = LoanStatusEnum.PENDING.id
        }

        getLoanById(loanId)
    }

    fun cancelLoan(loanId: Uuid): Boolean = transaction {
        val updated = Loans.update({ Loans.id eq loanId }) {
            it[loan_status] = LoanStatusEnum.CANCELLED.id
        }
        updated > 0
    }

    fun deleteLoan(loanId: Uuid): Boolean = transaction {
        val deleted = Loans.deleteWhere { Loans.id eq loanId }
        deleted > 0
    }
}