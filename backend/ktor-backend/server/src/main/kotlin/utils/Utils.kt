package nexus.util

/**
 * Creates a consistent error payload for API responses.
 *
 * @param message Human‑readable description of the problem.
 * @return A map that Ktor will serialize to JSON: { "error": "<message>" }
 */
fun errorResponse(message: String): Map<String, String> = mapOf("error" to message)