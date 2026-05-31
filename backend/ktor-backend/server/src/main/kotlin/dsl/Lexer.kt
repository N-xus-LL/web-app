package nexus.dsl

data class LexicalError(
    override val message: String,
    val label: String = "[LexicalError]"
) : Exception(message)

class Lexer(
    private val input: String
) {

    fun tokenize(): List<Token> {
        while (index < input.length) {
            val c = input[index]

            // Handle single-character tokens directly from lookup map
            if (singleCharTokens.containsKey(c)) {
                addToken(singleCharTokens[c]!!, c.toString())
                advanceCursor()
                continue
            }

            when (c) {
                // Ignore standard whitespace
                ' ', '\t', '\r' -> advanceCursor()

                // Track newlines and reset column tracking
                '\n' -> {
                    index++
                    line++
                    column = 0
                }

                // Skip single-line comments starting with '#'
                '#' -> {
                    while (index < input.length && input[index] != '\n') {
                        advanceCursor()
                    }
                }

                // Look-ahead comparison operators
                '=' -> {
                    if (match('=')) {
                        addToken(TokenType.EQUALS)
                        advanceCursor(2)
                    } else {
                        addToken(TokenType.ASSIGN)
                        advanceCursor()
                    }
                }
                '<' -> {
                    if (match('=')) {
                        addToken(TokenType.LESS_EQUAL)
                        advanceCursor(2)
                    } else {
                        addToken(TokenType.LESS)
                        advanceCursor()
                    }
                }
                '>' -> {
                    if (match('=')) {
                        addToken(TokenType.GREATER_EQUAL)
                        advanceCursor(2)
                    } else {
                        addToken(TokenType.GREATER)
                        advanceCursor()
                    }
                }

                else -> {
                    // Process Identifiers and Keywords
                    if (c.isLetter() || c == '_') {
                        val startIdx = index
                        val startCol = column

                        while (index < input.length && (input[index].isLetterOrDigit() || input[index] == '_')) {
                            advanceCursor()
                        }

                        val word = input.substring(startIdx, index)
                        val type = keywords[word.lowercase()] ?: TokenType.IDENTIFIER
                        tokens.add(Token(type, word, line, startCol))
                    }

                    // Process numeric values, including signed decimals and integers.
                    else if (c.isDigit() || (c == '-' && peekNext()?.isDigit() == true)) {
                        val startIdx = index
                        val startCol = column
                        var hasDecimal = false

                        if (input[index] == '-') {
                            advanceCursor()
                        }

                        while (index < input.length && (input[index].isDigit() || input[index] == '.')) {
                            if (input[index] == '.') {
                                if (hasDecimal) break // Stop parsing if a second dot is spotted
                                hasDecimal = true
                            }
                            advanceCursor()
                        }

                        val number = input.substring(startIdx, index)
                        tokens.add(Token(TokenType.NUMBER, number, line, startCol))
                    }

                    // Fallback exception for unrecognized text characters
                    else {
                        throw LexicalError(
                            "Unexpected character '$c' @ $line:$column"
                        )
                    }
                }
            }
        }

        // Complete the stream with an End-Of-File marker token
        addToken(TokenType.EOF)
        return tokens
    }


        // Properties

    private var index  = 0
    private var line   = 1
    private var column = 0
    private val tokens = mutableListOf<Token>()

    // Keywords lookup map - lowercase keys for case-insensitivity
    private val keywords = mapOf(
        "lender"     to TokenType.LENDER,
        "borrower"   to TokenType.BORROWER,
        "item"       to TokenType.ITEM,
        "strategy"   to TokenType.STRATEGY,
        "search"     to TokenType.SEARCH,
        "outputmode" to TokenType.OUTPUT_MODE,
        "if"         to TokenType.IF,
        "else"       to TokenType.ELSE,
        "foreach"    to TokenType.FOREACH,
        "output"     to TokenType.OUTPUT
    )

    // Token types of single character lexemes
    private val singleCharTokens = mapOf(
        '(' to TokenType.LPAREN,
        ')' to TokenType.RPAREN,
        '{' to TokenType.LBRACE,
        '}' to TokenType.RBRACE,
        ',' to TokenType.COMMA,
        ':' to TokenType.COLON,
        '.' to TokenType.DOT
    )

    // Statically defined lexemes of tokens
    private val tokenLexemes = mapOf(
        TokenType.LPAREN        to "(",
        TokenType.RPAREN        to ")",
        TokenType.LBRACE        to "{",
        TokenType.RBRACE        to "}",
        TokenType.COMMA         to ",",
        TokenType.COLON         to ":",
        TokenType.DOT           to ".",
        TokenType.ASSIGN        to "=",
        TokenType.EQUALS        to "==",
        TokenType.LESS          to "<",
        TokenType.LESS_EQUAL    to "<=",
        TokenType.GREATER       to ">",
        TokenType.GREATER_EQUAL to ">=",
        TokenType.EOF           to ""
    )


        // Helper Methods

    private fun advanceCursor(by: Int = 1) {
        index  += by
        column += by
    }

    private fun addToken(type: TokenType, customLexeme: String? = null) {
        // Look up static symbol text first, fall back to the custom string, throw if both are null
        val lexeme = tokenLexemes[type]
            ?: customLexeme
            ?: throw LexicalError(
                "Lexeme couldn't be resolved for token type '$type' @ $line:$column"
            )

        tokens.add(Token(type, lexeme, line, column))
    }

    private fun match(expected: Char): Boolean {
        if (index + 1 >= input.length) return false
        return input[index + 1] == expected
    }

    private fun peekNext(): Char? {
        if (index + 1 >= input.length) return null
        return input[index + 1]
    }

}
