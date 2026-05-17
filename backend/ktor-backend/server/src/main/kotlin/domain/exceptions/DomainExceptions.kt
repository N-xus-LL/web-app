package nexus.domain.exceptions

class UserNotFoundException(message: String = "User not found") : Exception(message)
class UserNotCreatedException(message: String = "User not created") : Exception(message)
class UsernameConflictException(message: String = "Username is already taken") : Exception(message)
class EmailConflictException(message: String = "Email is already registered") : Exception(message)
class IncorrectPasswordException(message: String = "The current password provided is incorrect") : Exception(message)
class InvalidParamException(message: String = "Invalid URL parameter") : Exception(message)