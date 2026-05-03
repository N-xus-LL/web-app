package nexus.routes

import io.ktor.http.HttpStatusCode
import nexus.repository.ItemRepository
import io.ktor.server.application.*
import io.ktor.server.request.receive
import io.ktor.server.response.*
import io.ktor.server.routing.*
import nexus.models.Item

fun Route.itemRoutes() {
    val itemRepository = ItemRepository()

    route("/items") {
        get {
            call.respond(HttpStatusCode.OK, itemRepository.getItems())
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull()

            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, "Invalid item id")
                return@get
            }

            val item = itemRepository.getItemById(id)

            if (item != null) {
                call.respond(HttpStatusCode.OK, item)
            } else {
                call.respond(HttpStatusCode.NotFound, "Item not found")
            }
        }

        post {
            val item = call.receive<Item>()
            val created = itemRepository.createItem(item)
            call.respond(HttpStatusCode.Created, created)
        }

        put {
            val item = call.receive<Item>()

            if (item.id == null) {
                call.respond(HttpStatusCode.BadRequest, "Invalid item id")
                return@put
            }

            val updated = itemRepository.updateItem(item)

            if (updated) {
                call.respond(HttpStatusCode.OK, "Item updated")
            } else {
                call.respond(HttpStatusCode.NotFound, "Item not found")
            }
        }

        delete("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull()

            if (id == null) {
                call.respond(HttpStatusCode.BadRequest, "Invalid item id")
                return@delete
            }

            val deleted = itemRepository.deleteItem(id)

            if (deleted) {
                call.respond(HttpStatusCode.NoContent)
            } else {
                call.respond(HttpStatusCode.NotFound, "Item not found")
            }
        }
    }
}