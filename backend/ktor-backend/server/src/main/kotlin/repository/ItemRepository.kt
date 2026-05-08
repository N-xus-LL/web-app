package nexus.repository

import nexus.database.Items
import nexus.models.Item
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

class ItemRepository() {

    fun getItems(): List<Item> = transaction {
        Items
            .selectAll()
            .map {
                Item(
                    id = it[Items.id],
                    title = it[Items.title],
                    price = it[Items.price],
                    location = it[Items.location],
                    link = it[Items.link]
                )
            }
    }

    fun getItemById(id: Int): Item? = transaction {
        Items
            .selectAll()
            .where { Items.id eq id }
            .map {
                Item(
                    id = it[Items.id],
                    title = it[Items.title],
                    price = it[Items.price],
                    location = it[Items.location],
                    link = it[Items.link]
                )
            }
            .singleOrNull()
    }

    fun createItem(item: Item): Item {
        val newId = transaction {
            Items.insert {
                it[Items.title] = item.title
                it[Items.price] = item.price
                it[Items.location] = item.location
                it[Items.link] = item.link
            } get Items.id
        }

        return item.copy(id = newId)
    }

    fun updateItem(item: Item): Boolean = transaction {
        Items.update({ Items.id eq item.id!! }) {
            it[Items.title] = item.title
            it[Items.price] = item.price
            it[Items.location] = item.location
            it[Items.link] = item.link
        } > 0
    }

    fun deleteItem(id: Int): Boolean = transaction {
        Items.deleteWhere { Items.id eq id } > 0
    }
}