@file:OptIn(ExperimentalUuidApi::class)

package nexus.auth

import nexus.database.AuthResponse
import nexus.database.UserDetailedResponse
import nexus.database.UserEntity
import nexus.database.UserLoginRequest
import nexus.database.UserRegisterRequest
import nexus.database.toSummaryResponse
import nexus.database.toDetailedResponse
import nexus.domain.exceptions.UserNotCreatedException
import nexus.repository.UserRepository
import org.mindrot.jbcrypt.BCrypt
import kotlin.uuid.ExperimentalUuidApi

class AuthService(
    private val userRepository: UserRepository
) {

    /**
     * Authenticates a user using either their email or username.
     */
    fun authenticate(loginDTO: UserLoginRequest): AuthResponse? {
        val identifier = loginDTO.identifier.trim()
        if (identifier.isEmpty() || loginDTO.password.isEmpty()) return null

        // Check if the identifier is an email by verifying presence of the reserved '@' symbol
        val user: UserEntity = if (identifier.contains("@")) {
            userRepository.getUserByEmail(identifier.lowercase()) // Emails are case-insensitive
        } else {
            userRepository.getUserByUsername(identifier)
        } ?: return null

        // Verify the password using the property securely extracted from the domain entity
        val isValidPassword = verifyPassword(loginDTO.password, user)

        return if (isValidPassword) {
            val token = JWTConfig.generateToken(user.id.toString(), user.username)
            AuthResponse(
                token = token,
                user = user.toSummaryResponse()
            )
        } else {
            null
        }
    }

    /**
     * Handles account creation, executing sanitization and password hashing before hitting the DB layer.
     */
    fun register(registerDTO: UserRegisterRequest): UserDetailedResponse {
        val cleanEmail = registerDTO.email.trim().lowercase()
        val cleanUsername = registerDTO.username.trim()
        val hashedPassword = hashPassword(registerDTO.password)

        val savedUser = userRepository.createUser(
            username = cleanUsername,
            email = cleanEmail,
            passwordHash = hashedPassword,
            firstName = registerDTO.firstName.trim(),
            lastName = registerDTO.lastName.trim(),
        )

        if (savedUser === null) throw UserNotCreatedException()

        return savedUser.toDetailedResponse()
    }

    companion object {
        fun hashPassword(password: String): String =
            BCrypt.hashpw(password, BCrypt.gensalt())

        fun verifyPassword(password: String, user: UserEntity): Boolean =
            BCrypt.checkpw(password, user.passwordHash)
    }
}