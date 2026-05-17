package nexus.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.github.cdimascio.dotenv.dotenv
import kotlin.time.Clock
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant
import java.util.Date

object JWTConfig {
    private const val ISSUER = "nexus-lendloop"

    // Load .env from the working directory, ignoring errors if it's missing (like in production)
    private val dotenv = dotenv {
        ignoreIfMalformed = true
        ignoreIfMissing = true
    }

    // Check system environment variables first (production), then fallback to your .env file
    private val secret: String
        = dotenv["JWT_SECRET"]
        ?: "fallback".also {
            println("⚠️ WARNING: JWT_SECRET missing from environment and .env file! Using fallback.")
        }

    private val algorithm = Algorithm.HMAC256(secret)

    val verifier = JWT
        .require(algorithm)
        .withIssuer(ISSUER)
        .build()!!

    /**
     * Generates a JWT token for a specific user ID and username
     */
    fun generateToken(id: String, username: String): String {
        val now: Instant = Clock.System.now()
        val expiration = now.plus(1.hours)

        return JWT.create()
            .withSubject("Authentication")
            .withIssuer(ISSUER)
            .withClaim("id", id)
            .withClaim("username", username)
            .withExpiresAt(Date(expiration.toEpochMilliseconds()))
            .sign(algorithm)
    }
}