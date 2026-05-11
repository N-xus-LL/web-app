package nexus.utils

class ValidationException(message: String, val field: String? = null) : RuntimeException(message)