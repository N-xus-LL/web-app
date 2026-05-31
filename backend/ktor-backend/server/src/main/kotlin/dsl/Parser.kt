package nexus.dsl

data class SyntaxError(
    override val message: String,
    val label: String = "[SyntaxError]"
) : Exception(message)

class Parser(
    private val tokens: List<Token>
) {

    fun parse(): ScriptAST {
        val configurations = mutableMapOf<String, ConfigurationBlock>()
        var strategyDirective: StrategyDirective? = null
        var outputModeDirective: OutputModeDirective? = null
        val executionBody = mutableListOf<StatementNode>()

        while (!isAtEOF()) {
            val token = peek()
            when (token.type) {
                TokenType.LENDER ->      configurations.putUnique("lender", parseLender(), token)
                TokenType.BORROWER ->    configurations.putUnique("borrower", parseBorrower(), token)
                TokenType.ITEM ->        configurations.putUnique("item", parseItem(), token)
                TokenType.SEARCH ->      configurations.putUnique("search", parseSearch(), token)
                TokenType.STRATEGY ->    strategyDirective   = parseStrategyDirective()
                TokenType.OUTPUT_MODE -> outputModeDirective = parseOutputModeDirective()

                // Once we hit script keywords, we pass execution over to the body parser
                TokenType.IF, TokenType.FOREACH, TokenType.OUTPUT -> {
                    executionBody.add(parseStatement())
                }

                TokenType.EOF -> break

                else -> throw SyntaxError(
                    "Unexpected token '${token.lexeme}' @ ${token.line}:${token.column}"
                )
            }
        }

        return ScriptAST(configurations, strategyDirective, outputModeDirective, executionBody)
    }


        // Properties

    private var current = 0


        // Helper Methods

    // Configuration Block Parsers

    private fun parseLender(): LenderBlock {
        consume(TokenType.LENDER)

        // Define exact property-to-type schema matching Kotlin internal types
        val lenderSchema = mapOf(
            "lat" to TokenType.NUMBER,
            "lon" to TokenType.NUMBER
        )

        val fields = parseBlockFields("lender", lenderSchema)

        return LenderBlock(
            lat = (fields["lat"] as Value.Number).value,
            lon = (fields["lon"] as Value.Number).value
        )
    }

    private fun parseBorrower(): BorrowerBlock {
        consume(TokenType.BORROWER)

        val borrowerSchema = mapOf(
            "lat" to TokenType.NUMBER,
            "lon" to TokenType.NUMBER
        )

        val fields = parseBlockFields("borrower", borrowerSchema)

        return BorrowerBlock(
            lat = (fields["lat"] as Value.Number).value,
            lon = (fields["lon"] as Value.Number).value
        )
    }

    private fun parseItem(): ItemBlock {
        consume(TokenType.ITEM)

        // Fully mirrors Kotlin property names word-for-word!
        val itemSchema = mapOf(
            "weight" to TokenType.NUMBER,
            "length" to TokenType.NUMBER,
            "width"  to TokenType.NUMBER,
            "height" to TokenType.NUMBER
        )

        val fields = parseBlockFields("item", itemSchema)

        return ItemBlock(
            weight = (fields["weight"] as Value.Number).value,
            length = (fields["length"] as Value.Number).value,
            width  = (fields["width"]  as Value.Number).value,
            height = (fields["height"] as Value.Number).value
        )
    }

    private fun parseSearch(): SearchBlock {
        consume(TokenType.SEARCH)

        // Optimized to camelCase: maps perfectly to SearchBlock properties without string mutations!
        val searchSchema = mapOf(
            "initialRadius" to TokenType.NUMBER,
            "radiusDelta"   to TokenType.NUMBER,
            "initial_radius" to TokenType.NUMBER,
            "delta" to TokenType.NUMBER
        )

        val fields = parseBlockFields(
            blockName = "search",
            schema = searchSchema,
            requiredFields = setOf("initialRadius", "radiusDelta"),
            aliases = mapOf(
                "initial_radius" to "initialRadius",
                "delta" to "radiusDelta"
            )
        )

        return SearchBlock(
            initialRadius = (fields["initialRadius"] as Value.Number).value,
            radiusDelta   = (fields["radiusDelta"]   as Value.Number).value,
        )
    }

    private fun parseStrategyDirective(): StrategyDirective {
        consume(TokenType.STRATEGY)
        consume(TokenType.COLON)

        val strategyName = consume(TokenType.IDENTIFIER).lexeme
        var customT: Double? = null

        if (strategyName.lowercase() == "custom") {
            consume(TokenType.LPAREN)
            customT = consume(TokenType.NUMBER).lexeme.toDouble()
            consume(TokenType.RPAREN)
        }

        return StrategyDirective(strategyName, customT)
    }

    private fun parseOutputModeDirective(): OutputModeDirective {
        consume(TokenType.OUTPUT_MODE)
        consume(TokenType.COLON)
        val mode = consume(TokenType.IDENTIFIER).lexeme
        return OutputModeDirective(mode)
    }


    // Script Statement Parsers

    private fun parseStatement(): StatementNode {
        return when (peek().type) {
            TokenType.IF -> parseIfStatement()
            TokenType.FOREACH -> parseForEachLoop()
            TokenType.OUTPUT -> parseOutputStatement()
            TokenType.IDENTIFIER -> parseAssignmentStatement()
            else -> throw SyntaxError(
                "Expected statement starting @ ${peek().line}:${peek().column}"
            )
        }
    }

    private fun parseIfStatement(): IfStatement {
        consume(TokenType.IF)
        consume(TokenType.LPAREN)
        val condition = parseExpression()
        consume(TokenType.RPAREN)

        consume(TokenType.LBRACE)
        val thenBranch = parseBlock()
        consume(TokenType.RBRACE)

        val elseIfBranches = mutableListOf<Pair<ExpressionNode, List<StatementNode>>>()
        var elseBranch: List<StatementNode>? = null

        while (match(TokenType.ELSE)) {
            if (match(TokenType.IF)) {
                consume(TokenType.LPAREN)
                val elseIfCond = parseExpression()
                consume(TokenType.RPAREN)
                consume(TokenType.LBRACE)
                val elseIfBlock = parseBlock()
                consume(TokenType.RBRACE)
                elseIfBranches.add(Pair(elseIfCond, elseIfBlock))
            } else {
                consume(TokenType.LBRACE)
                elseBranch = parseBlock()
                consume(TokenType.RBRACE)
                break // 'else' means we hit the final block
            }
        }

        return IfStatement(condition, thenBranch, elseIfBranches, elseBranch)
    }

    private fun parseForEachLoop(): ForEachLockerLoop {
        consume(TokenType.FOREACH)
        val iteratorName = consume(TokenType.IDENTIFIER).lexeme
        consume(TokenType.LBRACE)
        val body = parseBlock()
        consume(TokenType.RBRACE)

        return ForEachLockerLoop(iteratorName, body)
    }

    private fun parseAssignmentStatement(): AssignmentStatement {
        val objName = consume(TokenType.IDENTIFIER).lexeme
        consume(TokenType.DOT)
        val propName = consume(TokenType.IDENTIFIER).lexeme
        consume(TokenType.ASSIGN)
        val assignedValue = consume(TokenType.IDENTIFIER).lexeme

        return AssignmentStatement(
            PropertyAccess(objName, propName),
            IdentifierLiteral(assignedValue)
        )
    }

    private fun parseOutputStatement(): OutputStatement {
        consume(TokenType.OUTPUT)
        consume(TokenType.LPAREN)
        val target = consume(TokenType.IDENTIFIER).lexeme
        consume(TokenType.RPAREN)

        return OutputStatement(target)
    }

    private fun parseBlock(): List<StatementNode> {
        val body = mutableListOf<StatementNode>()

        while (peek().type != TokenType.RBRACE && peek().type != TokenType.EOF) {
            body.add(parseStatement())
        }

        return body
    }

    // Expression Parsing (expressions inside If checks)
    private fun parseExpression(): ExpressionNode {
        var left = parsePrimaryExpression()

        if (peek().type == TokenType.EQUALS
            || peek().type == TokenType.LESS_EQUAL
            || peek().type == TokenType.GREATER_EQUAL) {
            val opToken = advance()
            val op = when (opToken.type) {
                TokenType.EQUALS -> BinaryOp.EQUALS
                TokenType.LESS_EQUAL -> BinaryOp.LESS_EQUAL
                TokenType.GREATER_EQUAL -> BinaryOp.GREATER_EQUAL
                else -> throw SyntaxError(
                    "parseException(): Unexpected token '$opToken' @ ${peek().line}:${peek().column}"
                )
            }
            val right = parsePrimaryExpression()
            left = BinaryExpression(left, op, right)
        }

        return left
    }

    private fun parsePrimaryExpression(): ExpressionNode {
        val token = peek()
        return when (token.type) {
            TokenType.NUMBER -> NumberLiteral(advance().lexeme.toDouble())
            TokenType.IDENTIFIER, TokenType.OUTPUT_MODE, TokenType.SEARCH -> {
                val name = advance().lexeme
                if (peek().type == TokenType.DOT) {
                    consume(TokenType.DOT)
                    val property = consume(TokenType.IDENTIFIER).lexeme
                    PropertyAccess(name, property)
                } else {
                    IdentifierLiteral(name)
                }
            }
            else -> throw SyntaxError(
                "parsePrimaryExpression(): Expected expression @ ${token.line}:${token.column}"
            )
        }
    }


    // Helper Methods

    private fun peek()    = tokens[current]
    private fun isAtEOF() = peek().type == TokenType.EOF
    private fun advance() = tokens[current++]

    private fun match(type: TokenType): Boolean {
        if (isAtEOF() || peek().type != type) return false
        advance()
        return true
    }

    private fun consume(type: TokenType): Token {
        if (peek().type == type) return advance()

        throw SyntaxError(
            "consume(): Expected token type '${type.name}', encountered '${peek().lexeme}' @ ${peek().line}:${peek().column}"
        )
    }

    // Type-safe variant wrapper for schema values
    sealed interface Value {
        data class Number(val value: Double): Value
        data class Identifier(val name: String): Value
        // Easy to expand with Boolean(val value: Boolean), StringLiteral(val value: String) if needed
    }

    /**
     * Parses a block of fields, validating their names and token types against an expected schema map.
     * Throws explicit contextual errors for naming discrepancies, missing properties, or type violations.
     */
    private fun parseBlockFields(
        blockName: String,
        schema: Map<String, TokenType>,
        requiredFields: Set<String> = schema.keys,
        aliases: Map<String, String> = emptyMap()
    ): Map<String, Value> {
        consume(TokenType.LBRACE)
        val parsedFields = mutableMapOf<String, Value>()

        while (peek().type != TokenType.RBRACE && !isAtEOF()) {
            val rawFieldLabel = consume(TokenType.IDENTIFIER).lexeme
            val fieldLabel = aliases[rawFieldLabel] ?: rawFieldLabel
            consume(TokenType.COLON)

            // Structural Check: Verify the property identifier exists in the schema map
            val expectedType = schema[rawFieldLabel] ?: throw SyntaxError(
                "Unknown property '$rawFieldLabel' in $blockName block @ ${peek().line}:${peek().column}"
            )
            if (parsedFields.containsKey(fieldLabel)) {
                throw SyntaxError(
                    "Duplicate property '$fieldLabel' in $blockName block @ ${peek().line}:${peek().column}"
                )
            }

            // Type Check & Value Evaluation
            // Consume the token and wrap it into a sealed variant type
            val valueToken = consume(expectedType)
            val evaluatedValue = when (expectedType) {
                TokenType.NUMBER     -> Value.Number(valueToken.lexeme.toDouble())
                TokenType.IDENTIFIER -> Value.Identifier(valueToken.lexeme)
                else -> throw SyntaxError(
                    "Unhandled validation type transformation for ${expectedType.name}"
                )
            }
            parsedFields[fieldLabel] = evaluatedValue

            // Consume option-based comma delimiters
            if (peek().type == TokenType.COMMA) {
                advance()
            }
        }

        consume(TokenType.RBRACE)

        // Schema Completeness Check: Ensure all required fields were declared by the user
        for (requiredField in requiredFields) {
            if (!parsedFields.containsKey(requiredField)) {
                throw SyntaxError(
                    "Missing required property '$requiredField' in $blockName block configuration."
                )
            }
        }

        return parsedFields
    }

    private fun MutableMap<String, ConfigurationBlock>.putUnique(
        key: String,
        value: ConfigurationBlock,
        token: Token
    ) {
        if (containsKey(key)) {
            throw SyntaxError(
                "Duplicate '$key' configuration block @ ${token.line}:${token.column}"
            )
        }
        this[key] = value
    }

}
