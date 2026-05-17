package nexus.auth

import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.auth.Authentication
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.jwt.jwt

fun Application.configureJWT() {
    install(Authentication) {
        jwt("auth-jwt") {
            realm = "nexus-lendloop"
            verifier(JWTConfig.verifier)
            validate { credential ->
                if (credential.payload.getClaim("id").asString() != "") {
                    JWTPrincipal(credential.payload)
                } else null
            }
        }
    }
}