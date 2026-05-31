package nexus.dsl

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class InterpreterTest {
    @Test
    fun `selects closest fitting available locker from midpoint reference`() {
        val script = """
            lender {
              lat: 46.5600,
              lon: 15.6500
            }

            borrower {
              lat: 46.5500,
              lon: 15.6400
            }

            item {
              weight: 4,
              length: 30,
              width: 20,
              height: 10
            }

            search {
              initialRadius: 100,
              radiusDelta: 500
            }

            strategy: midpoint
            outputMode: app

            output(all_lockers)
        """.trimIndent()

        val ast = Parser(Lexer(script).tokenize()).parse()
        val validatedAst = SemanticAnalyzer(ast).analyze()
        val lockers = mutableListOf(
            locker(
                id = "small",
                lat = 46.5551,
                lon = 15.6451,
                maxWeightKg = 1.0,
                maxLengthCm = 10.0,
                maxWidthCm = 10.0,
                maxHeightCm = 10.0
            ),
            locker(
                id = "closest-fit",
                lat = 46.5550,
                lon = 15.6450,
                maxWeightKg = 10.0,
                maxLengthCm = 40.0,
                maxWidthCm = 30.0,
                maxHeightCm = 20.0
            ),
            locker(
                id = "far-fit",
                lat = 46.5580,
                lon = 15.6480,
                maxWeightKg = 10.0,
                maxLengthCm = 40.0,
                maxWidthCm = 30.0,
                maxHeightCm = 20.0
            )
        )

        val result = Interpreter(validatedAst, lockers).execute()

        val selected = result.single { it.isSelected }
        assertEquals("closest-fit", selected.id)
        assertEquals(LockerStatus.SELECTED, selected.status)
        assertEquals(LockerStatus.UNFITTING, result.single { it.id == "small" }.status)
        assertFalse(result.single { it.id == "far-fit" }.isSelected)
        assertTrue(selected.distance < result.single { it.id == "far-fit" }.distance)
    }

    private fun locker(
        id: String,
        lat: Double,
        lon: Double,
        maxWeightKg: Double,
        maxLengthCm: Double,
        maxWidthCm: Double,
        maxHeightCm: Double,
        available: Boolean = true
    ): Locker {
        val location = Location(
            id = "location-$id",
            lat = lat,
            lon = lon,
            city = "Maribor",
            address = "Test address $id"
        )
        val station = LockerStation(
            id = "station-$id",
            location = location
        )

        return Locker(
            id = id,
            station = station,
            boxNumber = 1,
            maxWeightKg = maxWeightKg,
            maxLengthCm = maxLengthCm,
            maxWidthCm = maxWidthCm,
            maxHeightCm = maxHeightCm,
            available = available
        )
    }
}
