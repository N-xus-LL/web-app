package nexus.routes

import io.ktor.http.HttpStatusCode
import nexus.repository.ItemRepository
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.*
import nexus.database.toEntity
import nexus.database.toResponse
import nexus.models.ItemRequest
import java.util.UUID

fun Route.itemRoutes() {
    val itemRepository = ItemRepository()

    route("/items") {
        get {
            val items = itemRepository.getItems()

            val response = items.map { it.toResponse() }
            call.respond(HttpStatusCode.OK, response)
        }

        get("/{id}") {
            val id = call.parameters["id"]

            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, "Invalid item id")
                return@get
            }

            val item = itemRepository.getItemById(UUID.fromString(id))

            if (item != null) {
                call.respond(HttpStatusCode.OK, item.toResponse())
            } else {
                call.respond(HttpStatusCode.NotFound, "Item not found")
            }
        }

        post {
            val item = call.receive<ItemRequest>()
            val created = itemRepository.createItem(item.toEntity())
            call.respond(HttpStatusCode.Created, created.toResponse())
        }

        put {
            val item = call.receive<ItemRequest>()

            if (item.id == null) {
                call.respond(HttpStatusCode.BadRequest, "Invalid item id")
                return@put
            }

            val updated = itemRepository.updateItem(item.toEntity())

            if (updated) {
                call.respond(HttpStatusCode.OK, "Item updated")
            } else {
                call.respond(HttpStatusCode.NotFound, "Item not found")
            }
        }

        delete("/{id}") {
            val id = call.parameters["id"]

            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, "Invalid item id")
                return@delete
            }

            val deleted = itemRepository.deleteItem(UUID.fromString(id))

            if (deleted) {
                call.respond(HttpStatusCode.NoContent)
            } else {
                call.respond(HttpStatusCode.NotFound, "Item not found")
            }
        }
    }
}