package nexus.dsl


// Root Script Abstract Syntax Tree (AST) Node

data class ScriptAST(
    val configurations: Map<String, ConfigurationBlock>,
    val strategy: StrategyDirective?,
    val outputMode: OutputModeDirective?,
    val executionBody: List<StatementNode>
)


// Configuration Data Block Structures

sealed interface ConfigurationBlock

data class LenderBlock(
    val lat: Double,
    val lon: Double
) : ConfigurationBlock

data class BorrowerBlock(
    val lat: Double,
    val lon: Double
) : ConfigurationBlock

data class ItemBlock(
    val weight: Double, // kg
    val length: Double, // cm
    val width:  Double, // cm
    val height: Double  // cm
) : ConfigurationBlock

data class SearchBlock(
    val initialRadius: Double, // m
    val radiusDelta:   Double, // m
    var finalRadius:   Double = initialRadius
) : ConfigurationBlock


// Directive Configuration Nodes

data class StrategyDirective(
    val strategyName: String, // "near_borrower", "midpoint", "near_lender", "custom"
    val customT: Double?      // Only populated if strategyName is "custom"
)

data class OutputModeDirective(
    val mode: String    // e.g., "app", "debug"
)


// Executable Statement Nodes

sealed interface StatementNode

data class IfStatement(
    val condition: ExpressionNode,
    val thenBranch: List<StatementNode>,
    val elseIfBranches: List<Pair<ExpressionNode, List<StatementNode>>>,
    val elseBranch: List<StatementNode>?
) : StatementNode

data class ForEachLockerLoop(
    val iteratorName: String,       // e.g., "locker"
    val body: List<StatementNode>
) : StatementNode

data class AssignmentStatement(
    val target: PropertyAccess,     // e.g., locker.status
    val value: IdentifierLiteral    // e.g., matching
) : StatementNode

data class OutputStatement(
    val target: String  // Variable token lexeme to export
) : StatementNode


// Expression Nodes

sealed interface ExpressionNode

enum class BinaryOp {
    EQUALS,       // ==
    LESS_EQUAL,   // <=
    GREATER_EQUAL // >=
}

data class BinaryExpression(
    val left: ExpressionNode,
    val operator: BinaryOp,
    val right: ExpressionNode
) : ExpressionNode

data class NumberLiteral(
    val value: Double
) : ExpressionNode

data class IdentifierLiteral(
    val name: String
) : ExpressionNode

data class PropertyAccess(
    val objectName: String,  // e.g., "locker"
    val propertyName: String // e.g., "distance"
) : ExpressionNode
