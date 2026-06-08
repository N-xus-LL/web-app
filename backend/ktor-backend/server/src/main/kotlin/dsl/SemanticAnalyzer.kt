package nexus.dsl

data class SemanticError(
    override val message: String,
    val label: String = "[SemanticError]"
) : Exception(message)

class SemanticAnalyzer(
    val ast: ScriptAST
) {
    val warnings = mutableListOf<String>()

    private val allowedLockerProperties = setOf(
        "lat", "lon", "distance", "status", "is_selected", "available", "fits_item"
    )
    private val allowedSearchProperties = setOf(
        "final_radius"
    )
    private val allowedMutableProperties = setOf(
        "status"
    )
    private val numericLockerProperties = setOf(
        "lat", "lon", "distance"
    )
    private val stringLockerProperties = setOf(
        "status"
    )
    private val booleanLockerProperties = setOf(
        "is_selected", "available", "fits_item"
    )
    private val allowedStatusValues = setOf(
        "selected",
        "matching",
        "unfitting",
        "out_of_radius",
        "unavailable",
        "undefined"
    )
    private val allowedOutputs = setOf(
        "minimal_route", "handoff_plan", "all_lockers"
    )
    private val allowedOutputModes = setOf(
        "app", "debug"
    )

    fun analyze(): ValidatedAST {
        // Inputs validation
        validateLenderAndBorrower()
        validateItem()
        validateSearch()
        validateStrategy()
        validateOutputMode()

        // Statements validation
        val activeScopes = mutableSetOf<String>()
        for (statement in ast.executionBody) {
            validateStatement(statement, activeScopes)
        }

        return ValidatedAST(ast, warnings)
    }


    private fun validateLenderAndBorrower() {
        val lender   = validateLender()
        val borrower = validateBorrower()
        checkLenderBorrowerCoordinates(lender, borrower)
    }

    private fun validateLender(): LenderBlock {
        val lender = ast.configurations["lender"] as? LenderBlock
            ?: throw SemanticError("'lender' configuration block is missing.")

        validateCoordinates("lender", lender.lat, lender.lon)

        return lender
    }

    private fun validateBorrower(): BorrowerBlock {
        val borrower = ast.configurations["borrower"] as? BorrowerBlock
            ?: throw SemanticError("'borrower' configuration block is missing.")

        validateCoordinates("borrower", borrower.lat, borrower.lon)

        return borrower
    }

    private fun checkLenderBorrowerCoordinates(
        lender: LenderBlock, borrower: BorrowerBlock
    ) {
        if (lender.lat == borrower.lat && lender.lon == borrower.lon) {
            warnings.add("[WARNING] Lender and borrower coordinates are identical.")
        }
    }

    private fun validateItem() {
        val item = ast.configurations["item"] as? ItemBlock
            ?: throw SemanticError("'item' configuration block is missing.")

        if (item.weight <= 0) {
            throw SemanticError("Item weight must be a positive value.")
        }
        if (item.length <= 0 || item.width <= 0 || item.height <= 0) {
            throw SemanticError("Item dimensions (length, width, height) must all be positive values.")
        }
    }

    private fun validateSearch() {
        val search = ast.configurations["search"] as? SearchBlock
            ?: throw SemanticError("'search' configuration block is missing.")

        if (search.initialRadius <= 0) {
            throw SemanticError("Initial search radius must be positive.")
        }
        if (search.radiusDelta <= 0) {
            throw SemanticError("Search radius delta step must be positive.")
        }
    }

    private fun validateStrategy() {
        if (ast.strategy != null) {
            val name = ast.strategy.strategyName.lowercase()
            if (name == "custom") {
                val customT = ast.strategy.customT
                    ?: throw SemanticError("'custom' strategy requires a specified parameter value (t).")
                if (customT !in 0.0..1.0) {
                    throw SemanticError("Custom interpolation parameter 't' must be between 0.0 and 1.0.")
                }
            } else {
                val validStrategies = setOf("near_borrower", "midpoint", "near_lender")
                if (name !in validStrategies) {
                    throw SemanticError("Unknown strategy identifier '${ast.strategy.strategyName}'.")
                }
            }
        }
    }

    private fun validateOutputMode() {
        val mode = ast.outputMode?.mode?.lowercase() ?: return

        if (mode !in allowedOutputModes) {
            throw SemanticError(
                "Invalid output mode '$mode'. Expected values: $allowedOutputModes"
            )
        }
    }

    private fun validateStatement(statement: StatementNode, activeScopes: MutableSet<String>) {
        when (statement) {
            is ForEachLockerLoop -> {
                val iterator = statement.iteratorName
                if (activeScopes.contains(iterator)) {
                    throw SemanticError(
                        "Variable '$iterator' is already defined in this scope."
                    )
                }
                // Register iterator variable name to local scope context
                activeScopes.add(iterator)

                // Recursively validate inner scope script block statements
                for (innerStatement in statement.body) {
                    validateStatement(innerStatement, activeScopes)
                }

                // Unregister scope context once loop block ends execution
                activeScopes.remove(iterator)
            }

            is IfStatement -> {
                validateExpression(statement.condition, activeScopes)
                statement.thenBranch.forEach { validateStatement(it, activeScopes) }

                statement.elseIfBranches.forEach { (condition, branch) ->
                    validateExpression(condition, activeScopes)
                    branch.forEach { validateStatement(it, activeScopes) }
                }

                statement.elseBranch?.forEach { validateStatement(it, activeScopes) }
            }

            is AssignmentStatement -> {
                val target = statement.target

                // Verify identifier exists within local scopes
                if (!activeScopes.contains(target.objectName)) {
                    throw SemanticError(
                        "Variable '${target.objectName}' is referenced out of scope or undefined."
                    )
                }

                // Verify the property target is permitted to change values
                if (!allowedMutableProperties.contains(target.propertyName)) {
                    throw SemanticError(
                        "Property '${target.objectName}.${target.propertyName}' is immutable and cannot be modified."
                    )
                }
                if (target.propertyName == "status" && statement.value.name.lowercase() !in allowedStatusValues) {
                    throw SemanticError(
                        "Invalid locker status '${statement.value.name}'. Expected values: $allowedStatusValues"
                    )
                }
            }

            is OutputStatement -> {
                if (!allowedOutputs.contains(statement.target)) {
                    throw SemanticError(
                        "Invalid target payload export context: '${statement.target}'. " +
                                "Expected values: $allowedOutputs"
                    )
                }
            }
        }
    }


    private fun validateExpression(expression: ExpressionNode, activeScopes: Set<String>) {
        when (expression) {
            is BinaryExpression -> {
                validateExpression(expression.left, activeScopes)
                validateExpression(expression.right, activeScopes)
                val leftType = inferExpressionType(expression.left, activeScopes)
                val rightType = inferExpressionType(expression.right, activeScopes)

                when (expression.operator) {
                    BinaryOp.EQUALS -> {
                        if (leftType != rightType) {
                            throw SemanticError(
                                "Cannot compare expressions of different types with '==': $leftType and $rightType."
                            )
                        }
                        validateStatusComparisonLiteral(expression.left, expression.right)
                    }
                    BinaryOp.LESS_EQUAL, BinaryOp.GREATER_EQUAL -> {
                        if (leftType != ExpressionType.NUMBER || rightType != ExpressionType.NUMBER) {
                            throw SemanticError(
                                "Operator '${expression.operator.symbol}' requires numeric expressions."
                            )
                        }
                    }
                }
            }
            is PropertyAccess -> {
                if (expression.objectName == "search") {
                    if (expression.propertyName !in allowedSearchProperties) {
                        throw SemanticError(
                            "Unknown attribute reference: '${expression.objectName}.${expression.propertyName}'. " +
                                    "Allowed search properties: $allowedSearchProperties"
                        )
                    }
                    return
                }

                // Scope Check
                if (!activeScopes.contains(expression.objectName)) {
                    throw SemanticError(
                        "Property read error: Variable '${expression.objectName}' is undefined in the active scope context."
                    )
                }
                // Whitelist Attribute Check
                if (!allowedLockerProperties.contains(expression.propertyName)) {
                    throw SemanticError(
                        "Unknown attribute reference: '${expression.objectName}.${expression.propertyName}'. " +
                                "Allowed locker properties: $allowedLockerProperties"
                    )
                }
            }
            // Literal nodes require no runtime validation checks
            is NumberLiteral, is IdentifierLiteral -> return
        }
    }

    private fun inferExpressionType(expression: ExpressionNode, activeScopes: Set<String>): ExpressionType {
        return when (expression) {
            is NumberLiteral -> ExpressionType.NUMBER
            is IdentifierLiteral -> ExpressionType.STRING
            is PropertyAccess -> {
                validateExpression(expression, activeScopes)
                when {
                    expression.objectName == "search" && expression.propertyName in allowedSearchProperties -> ExpressionType.NUMBER
                    expression.propertyName in numericLockerProperties -> ExpressionType.NUMBER
                    expression.propertyName in stringLockerProperties -> ExpressionType.STRING
                    expression.propertyName in booleanLockerProperties -> ExpressionType.BOOLEAN
                    else -> throw SemanticError(
                        "Unknown attribute reference: '${expression.objectName}.${expression.propertyName}'. " +
                                "Allowed locker properties: $allowedLockerProperties"
                    )
                }
            }
            is BinaryExpression -> ExpressionType.BOOLEAN
        }
    }

    private fun validateStatusComparisonLiteral(left: ExpressionNode, right: ExpressionNode) {
        val literal = when {
            left.isStatusProperty() && right is IdentifierLiteral -> right.name
            right.isStatusProperty() && left is IdentifierLiteral -> left.name
            else -> return
        }

        if (literal.lowercase() !in allowedStatusValues) {
            throw SemanticError(
                "Invalid locker status '$literal'. Expected values: $allowedStatusValues"
            )
        }
    }

    private fun ExpressionNode.isStatusProperty(): Boolean {
        return this is PropertyAccess && propertyName == "status"
    }

    private fun validateCoordinates(blockName: String, lat: Double, lon: Double) {
        if (lat !in -90.0..90.0) {
            throw SemanticError("$blockName: latitude ($lat) is out of bounds (-90 to 90).")
        }
        if (lon !in -180.0..180.0) {
            throw SemanticError("$blockName: longitude ($lon) is out of bounds (-180 to 180).")
        }
    }
}

data class ValidatedAST(
    val ast:      ScriptAST,
    val warnings: List<String> = emptyList()
)

private enum class ExpressionType {
    NUMBER,
    BOOLEAN,
    STRING
}

private val BinaryOp.symbol: String
    get() = when (this) {
        BinaryOp.EQUALS -> "=="
        BinaryOp.LESS_EQUAL -> "<="
        BinaryOp.GREATER_EQUAL -> ">="
    }
