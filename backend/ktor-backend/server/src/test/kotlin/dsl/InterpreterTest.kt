/*package nexus.dsl

import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
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
                maxWeight = 1.0,
                maxLength = 10.0,
                maxWidth = 10.0,
                maxHeight = 10.0
            ),
            locker(
                id = "closest-fit",
                lat = 46.5550,
                lon = 15.6450,
                maxWeight = 10.0,
                maxLength = 40.0,
                maxWidth = 30.0,
                maxHeight = 20.0
            ),
            locker(
                id = "far-fit",
                lat = 46.5580,
                lon = 15.6480,
                maxWeight = 10.0,
                maxLength = 40.0,
                maxWidth = 30.0,
                maxHeight = 20.0
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

    @Test
    fun `exports app geojson with users reference point and selected locker`() {
        val interpreter = buildInterpreter(outputMode = "app")
        interpreter.execute()

        val geoJson = interpreter.exportGeoJson()
        val features = geoJson["features"]!!.jsonArray
        val kinds = features.map { it.jsonObject["properties"]!!.jsonObject["kind"]!!.jsonPrimitive.content }
        val lockerStatuses = features
            .filter { it.jsonObject["properties"]!!.jsonObject["kind"]!!.jsonPrimitive.content == "locker" }
            .map { it.jsonObject["properties"]!!.jsonObject["status"]!!.jsonPrimitive.content }

        assertEquals("FeatureCollection", geoJson["type"]!!.jsonPrimitive.content)
        assertEquals(listOf("user", "user", "reference_point", "locker"), kinds)
        assertEquals(listOf("selected"), lockerStatuses)
    }

    @Test
    fun `exports debug geojson with all lockers and status properties`() {
        val interpreter = buildInterpreter(outputMode = "debug")
        interpreter.execute()

        val geoJson = interpreter.exportGeoJson()
        val features = geoJson["features"]!!.jsonArray
        val lockerFeatures = features
            .filter { it.jsonObject["properties"]!!.jsonObject["kind"]!!.jsonPrimitive.content == "locker" }
        val lockerStatuses = lockerFeatures
            .map { it.jsonObject["properties"]!!.jsonObject["status"]!!.jsonPrimitive.content }
            .toSet()

        assertEquals(6, features.size)
        assertEquals(3, lockerFeatures.size)
        assertTrue("selected" in lockerStatuses)
        assertTrue("out_of_radius" in lockerStatuses)
        assertTrue("unfitting" in lockerStatuses)
    }

    @Test
    fun `runs debug handoff script with snake case search and locker helpers`() {
        val script = """
            lender { lat: 46.0569, lon: 14.5058 }
            borrower { lat: 46.1512, lon: 14.5951 }
            item { weight: 2.5, length: 30.0, width: 20.0, height: 15.0 }
            strategy: near_borrower
            search { initial_radius: 500.0, delta: 250.0 }
            outputMode: debug

            if (outputMode == app) {
                output(minimal_route)
            } else if (outputMode == debug) {
                foreach locker {
                    if (locker.is_selected) {
                        locker.status = selected
                    } else if (locker.available) {
                        if (locker.distance <= search.final_radius) {
                            if (locker.fits_item) { locker.status = matching }
                            else { locker.status = unfitting }
                        } else {
                            locker.status = out_of_radius
                        }
                    } else {
                        # Locker is occupied or broken
                        locker.status = unavailable
                    }
                }

                output(all_lockers)
            }
        """.trimIndent()

        val lockers = mutableListOf(
            locker(
                id = "selected-fit",
                lat = 46.1276,
                lon = 14.5728,
                maxWeight = 10.0,
                maxLength = 50.0,
                maxWidth = 40.0,
                maxHeight = 30.0
            ),
            locker(
                id = "too-small",
                lat = 46.1277,
                lon = 14.5729,
                maxWeight = 1.0,
                maxLength = 10.0,
                maxWidth = 10.0,
                maxHeight = 10.0
            ),
            locker(
                id = "unavailable",
                lat = 46.1278,
                lon = 14.5730,
                maxWeight = 10.0,
                maxLength = 50.0,
                maxWidth = 40.0,
                maxHeight = 30.0,
                available = false
            ),
            locker(
                id = "outside",
                lat = 46.1500,
                lon = 14.5950,
                maxWeight = 10.0,
                maxLength = 50.0,
                maxWidth = 40.0,
                maxHeight = 30.0
            )
        )

        val ast = Parser(Lexer(script).tokenize()).parse()
        val validatedAst = SemanticAnalyzer(ast).analyze()
        val result = Interpreter(validatedAst, lockers).execute()

        assertEquals(LockerStatus.SELECTED, result.single { it.id == "selected-fit" }.status)
        assertEquals(LockerStatus.UNFITTING, result.single { it.id == "too-small" }.status)
        assertEquals(LockerStatus.UNAVAILABLE, result.single { it.id == "unavailable" }.status)
        assertEquals(LockerStatus.OUT_OF_RADIUS, result.single { it.id == "outside" }.status)
    }

    private fun buildInterpreter(outputMode: String): Interpreter {
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
            outputMode: $outputMode

            output(all_lockers)
        """.trimIndent()

        val ast = Parser(Lexer(script).tokenize()).parse()
        val validatedAst = SemanticAnalyzer(ast).analyze()

        return Interpreter(validatedAst, sampleLockers())
    }

    private fun sampleLockers(): MutableList<Locker> =
        mutableListOf(
            locker(
                id = "small",
                lat = 46.5551,
                lon = 15.6451,
                maxWeight = 1.0,
                maxLength = 10.0,
                maxWidth = 10.0,
                maxHeight = 10.0
            ),
            locker(
                id = "closest-fit",
                lat = 46.5550,
                lon = 15.6450,
                maxWeight = 10.0,
                maxLength = 40.0,
                maxWidth = 30.0,
                maxHeight = 20.0
            ),
            locker(
                id = "far-fit",
                lat = 46.5580,
                lon = 15.6480,
                maxWeight = 10.0,
                maxLength = 40.0,
                maxWidth = 30.0,
                maxHeight = 20.0
            )
        )

    private fun locker(
        id: String,
        lat: Double,
        lon: Double,
        maxWeight: Double,
        maxLength: Double,
        maxWidth: Double,
        maxHeight: Double,
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
            maxWeight = maxWeight,
            maxLength = maxLength,
            maxWidth = maxWidth,
            maxHeight = maxHeight,
            available = available
        )
    }
}
*/