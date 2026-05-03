package nexus.repository

import nexus.database.ItemTable
import nexus.models.Item
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

class ItemRepository() {

    fun getItems(): List<Item> = transaction {
        ItemTable
            .selectAll()
            .map {
                Item(
                    id = it[ItemTable.id],
                    title = it[ItemTable.title],
                    price = it[ItemTable.price],
                    location = it[ItemTable.location],
                    link = it[ItemTable.link]
                )
            }
    }

    fun getItemById(id: Int): Item? = transaction {
        ItemTable
            .selectAll()
            .where { ItemTable.id eq id }
            .map {
                Item(
                    id = it[ItemTable.id],
                    title = it[ItemTable.title],
                    price = it[ItemTable.price],
                    location = it[ItemTable.location],
                    link = it[ItemTable.link]
                )
            }
            .singleOrNull()
    }

    fun createItem(item: Item): Item {
        val newId = transaction {
            ItemTable.insert {
                it[ItemTable.title] = item.title
                it[ItemTable.price] = item.price
                it[ItemTable.location] = item.location
                it[ItemTable.link] = item.link
            } get ItemTable.id
        }

        return item.copy(id = newId)
    }

    fun updateItem(item: Item): Boolean = transaction {
        ItemTable.update({ ItemTable.id eq item.id!! }) {
            it[ItemTable.title] = item.title
            it[ItemTable.price] = item.price
            it[ItemTable.location] = item.location
            it[ItemTable.link] = item.link
        } > 0
    }

    fun deleteItem(id: Int): Boolean = transaction {
        ItemTable.deleteWhere { ItemTable.id eq id } > 0
    }
}