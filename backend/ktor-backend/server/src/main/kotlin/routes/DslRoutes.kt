package nexus.routes

import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receiveText
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import dsl.Interpreter
import nexus.dsl.Lexer
import nexus.dsl.OutputModeDirective
import nexus.dsl.Parser
import dsl.RuntimeError
import nexus.dsl.SemanticAnalyzer
import nexus.dsl.SemanticError
import nexus.dsl.SyntaxError
import nexus.repository.DslRepository

fun Route.dslRoutes() {
    val dslRepository = DslRepository()

    route("/api/dsl") {
        post("/") {
            val script = call.receiveText().trim()
            if (script.isBlank()) {
                call.respond(HttpStatusCode.BadRequest, "DSL script body is required")
                return@post
            }

            val mode = "app"

            try {
                val parsedAst = Parser(Lexer(script).tokenize()).parse()
                val ast = parsedAst.copy(outputMode = OutputModeDirective(mode))
                val validatedAst = SemanticAnalyzer(ast).analyze()
                val lockers = dslRepository.getLockers()
                val geoJson = Interpreter(validatedAst, lockers).exportGeoJson()

                call.respond(HttpStatusCode.OK, geoJson)
            } catch (error: SyntaxError) {
                call.respond(HttpStatusCode.BadRequest, error.message)
            } catch (error: SemanticError) {
                call.respond(HttpStatusCode.BadRequest, error.message)
            } catch (error: RuntimeError) {
                call.respond(HttpStatusCode.BadRequest, error.message)
            }
        }

        post("/geojson") {
            val script = call.receiveText().trim()
            if (script.isBlank()) {
                call.respond(HttpStatusCode.BadRequest, "DSL script body is required")
                return@post
            }

            val mode = call.request.queryParameters["mode"]
            if (mode != null && mode.lowercase() !in setOf("app", "debug")) {
                call.respond(HttpStatusCode.BadRequest, "Invalid mode. Expected app or debug")
                return@post
            }

            try {
                val parsedAst = Parser(Lexer(script).tokenize()).parse()
                val ast = if (mode == null) {
                    parsedAst
                } else {
                    parsedAst.copy(outputMode = OutputModeDirective(mode))
                }
                val validatedAst = SemanticAnalyzer(ast).analyze()
                val lockers = dslRepository.getLockers()
                val geoJson = Interpreter(validatedAst, lockers).exportGeoJson()

                call.respond(HttpStatusCode.OK, geoJson)
            } catch (error: SyntaxError) {
                call.respond(HttpStatusCode.BadRequest, error.message)
            } catch (error: SemanticError) {
                call.respond(HttpStatusCode.BadRequest, error.message)
            } catch (error: RuntimeError) {
                call.respond(HttpStatusCode.BadRequest, error.message)
            }
        }
    }
}
