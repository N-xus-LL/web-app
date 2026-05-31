package nexus.dsl

enum class TokenType {
    // Structural Data Block Keywords
    LENDER,
    BORROWER,
    ITEM,
    SEARCH,

    // Directive Configuration Keywords
    STRATEGY,
    OUTPUT_MODE,

    // Control Flow Keywords
    IF,
    ELSE,
    FOREACH,

    // Core Action Keywords
    OUTPUT,

    // Dynamic Literals & Identifiers
    IDENTIFIER, // Matches names like 'locker', 'search', 'matching', 'outputMode'
    NUMBER,     // Matches '46.0569', '2.5', '500'

    // Operators & Punctuation
    LPAREN,        // (
    RPAREN,        // )
    LBRACE,        // {
    RBRACE,        // }
    COMMA,         // ,
    COLON,         // :
    DOT,           // .
    ASSIGN,        // =
    EQUALS,        // ==
    LESS,          // <
    LESS_EQUAL,    // <=
    GREATER,       // >
    GREATER_EQUAL, // >=

    // End of file
    EOF
}

data class Token(
    val type:   TokenType,
    val lexeme: String,
    val line:   Int,
    val column: Int,
)
