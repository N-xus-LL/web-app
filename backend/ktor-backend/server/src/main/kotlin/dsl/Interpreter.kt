package nexus.dsl

import kotlin.math.*
import kotlinx.serialization.json.JsonObject


enum class LockerStatus {
    SELECTED,       // Closest candidate locker
    MATCHING,       // Lockers which match the criteria
    UNFITTING,      // Lockers which dimensions are not fitting
    OUT_OF_RADIUS,  // Lockers which are in locality, but are out of [final] radius
    UNAVAILABLE,    // Lockers which are occupied or broken
    UNDEFINED       // Initial locker state
}

data class Location(
    val id: String,
    val lat: Double,
    val lon: Double,
    val city: String,
    val address: String
)

data class LockerStation(
    val id: String,
    val location: Location
)

data class Locker(
    val id: String,
    val station: LockerStation,
    val boxNumber: Int,
    val maxWeight: Double,
    val maxLength: Double,
    val maxWidth: Double,
    val maxHeight: Double,
    val available: Boolean,

    // Mutable fields evaluated dynamically by the interpreter pipeline
    var distance: Double = 0.0,
    var status: LockerStatus = LockerStatus.UNDEFINED,
    var isSelected: Boolean = false
)


data class RuntimeError(
    override val message: String,
    val label: String = "[RuntimeError]"
) : Exception(message)

class Interpreter(
    private val validatedAst: ValidatedAST,
    private val lockers: MutableList<Locker>
) {
    private val ast = validatedAst.ast
    private val lender   = ast.configurations["lender"] as LenderBlock
    private val borrower = ast.configurations["borrower"] as BorrowerBlock
    private val item     = ast.configurations["item"] as ItemBlock
    private val search   = ast.configurations["search"] as SearchBlock
    private val referencePoint = calculateReferencePoint()
    private var lockersInRadius = mutableListOf<Locker>()
    private var lockersMatching = mutableListOf<Locker>()
    private var selectedLocker: Locker? = null
    private var executed = false

    fun execute(): List<Locker> {
        lockersInRadius = mutableListOf()
        lockersMatching = mutableListOf()
        selectedLocker = null

        // Resolve locker distances from the class-level reference point.
        findMatch()

        // Process script execution blocks sequentially
        // The mutable map keeps track of locally bound scope variables (e.g., current loop iteration)
        val runtimeEnv = mutableMapOf<String, Any>()

        for (statement in ast.executionBody) {
            executeStatement(statement, runtimeEnv)
        }

        markSelectedLocker()
        executed = true

        // Return evaluated collection results back to your service layer
        return lockers
    }

    fun exportGeoJson(): JsonObject {
        if (!executed) {
            execute()
        }

        val mode = ast.outputMode?.mode?.lowercase() ?: "app"
        val referenceRadius = search.finalRadius

        return when (mode) {
            "debug" -> GeoJsonExporter.exportDebug(lender, borrower, lockers, referencePoint, referenceRadius)
            else -> GeoJsonExporter.exportApp(lender, borrower, selectedLocker!!)
        }
    }

    // Statement Execution
    private fun executeStatement(
        statement: StatementNode,
        env: MutableMap<String, Any>
    ) {
        when (statement) {
            is ForEachLockerLoop -> {
                val iteratorVar = statement.iteratorName // e.g. "locker"

                // Run the script block over every database candidate sequentially
                for (locker in lockers) {
                    env[iteratorVar] = locker // Bind current candidate to local scope context

                    for (innerStatement in statement.body) {
                        executeStatement(innerStatement, env)
                    }
                }

                env.remove(iteratorVar) // Clean up scope once loop terminates
            }

            is IfStatement -> {
                if (evaluateExpression(statement.condition, env) as Boolean) {
                    statement.thenBranch.forEach { executeStatement(it, env) }
                    return
                }

                for ((condition, branch) in statement.elseIfBranches) {
                    if (evaluateExpression(condition, env) as Boolean) {
                        branch.forEach { executeStatement(it, env) }
                        return
                    }
                }

                statement.elseBranch?.forEach { executeStatement(it, env) }
            }

            is AssignmentStatement -> {
                val target = statement.target
                val targetObject = env[target.objectName] ?: return

                if (targetObject is Locker && target.propertyName == "status") {
                    val incomingValue = statement.value.name.uppercase()
                    targetObject.status = LockerStatus.valueOf(incomingValue)
                }
            }

            is OutputStatement -> {
                // Handle Directive Formatting Logs based on OutputMode Directive configurations
                val mode = ast.outputMode?.mode?.lowercase() ?: "app"
                if (mode == "debug") {
                    println("[OUTPUT DIRECTIVE ($mode)] Export targets context state triggered for payload: '${statement.target}'")
                    if (statement.target == "minimal_route") {
                        val optimizedMatch = selectedLocker ?: lockersMatching.minByOrNull { it.distance }
                        println(" > Best Optimized Target Match Node found: $optimizedMatch")
                    } else if (statement.target == "handoff_plan") {
                        println(" > Selected locker: ${selectedLocker ?: "none"}")
                        println(" > Matching alternatives:")
                        lockersMatching
                            .filter { it != selectedLocker }
                            .sortedBy { it.distance }
                            .forEach { println("   - $it") }
                    } else if (statement.target == "all_lockers") {
                        println(" > All Evaluated Candidate Context Matrix:")
                        lockers.sortedBy { it.distance }.forEach { println("   - $it") }
                    }
                }
            }
        }
    }

    // Expression Evaluation
    private fun evaluateExpression(
        expr: ExpressionNode,
        env: Map<String, Any>
    ): Any {
        return when (expr) {
            is NumberLiteral -> expr.value
            is IdentifierLiteral -> {
                if (expr.name == "outputMode") ast.outputMode?.mode?.lowercase() ?: "app"
                else expr.name
            }

            is PropertyAccess -> {
                if (expr.objectName == "search") {
                    return when (expr.propertyName) {
                        "final_radius" -> search.finalRadius
                        else -> throw RuntimeError("Unknown property '${expr.objectName}.${expr.propertyName}'")
                    }
                }

                val boundObj = env[expr.objectName] ?: throw RuntimeError("Reference missing for ${expr.objectName}")
                if (boundObj is Locker) {
                    when (expr.propertyName) {
                        "lat"      -> boundObj.station.location.lat
                        "lon"      -> boundObj.station.location.lon
                        "distance" -> boundObj.distance
                        "status"   -> boundObj.status.name.lowercase()
                        "is_selected" -> boundObj.isSelected
                        "available" -> boundObj.available
                        "fits_item" -> lockerFitsItem(boundObj)
                        else       -> throw RuntimeError("Unknown property '${expr.propertyName}'")
                    }
                } else throw RuntimeError("Target object type is unresolvable")
            }

            is BinaryExpression -> {
                val leftVal = evaluateExpression(expr.left, env)
                val rightVal = evaluateExpression(expr.right, env)

                when (expr.operator) {
                    BinaryOp.EQUALS -> leftVal == rightVal
                    BinaryOp.LESS_EQUAL -> {
                        if (leftVal is Double && rightVal is Double) leftVal <= rightVal
                        else throw RuntimeError("Operation '<=' cannot be applied to non-numeric types.")
                    }
                    BinaryOp.GREATER_EQUAL -> {
                        if (leftVal is Double && rightVal is Double) leftVal >= rightVal
                        else throw RuntimeError("Operation '<=' cannot be applied to non-numeric types.")
                    }
                }
            }
        }
    }

    // Reference point calculation
    private fun calculateReferencePoint(): Pair<Double, Double> {
        val strategyName = ast.strategy?.strategyName?.lowercase() ?: "midpoint"
        val t = when (strategyName) {
            "near_lender"   -> 0.75
            "midpoint"      -> 0.50
            "near_borrower" -> 0.25
            "custom"        -> ast.strategy!!.customT ?: 0.5
            else -> {
                throw RuntimeError("Unknown strategy '$strategyName' found")
            }
        }

        val referenceLat = borrower.lat + t * (lender.lat - borrower.lat)
        val referenceLon = borrower.lon + t * (lender.lon - borrower.lon)

        return Pair(referenceLat, referenceLon)
    }

    // Finding lockers which are spatial matches
    private fun findMatch() {
        if (lockers.isEmpty()) {
            throw RuntimeError("No lockers were provided to the interpreter.")
        }

        lockers.forEach { locker ->
            locker.distance = haversineDistance(
                referencePoint.first,
                referencePoint.second,
                locker.station.location.lat,
                locker.station.location.lon
            )
            locker.status = LockerStatus.UNDEFINED
            locker.isSelected = false
        }

        var currentRadius = search.finalRadius
        val farthestLockerDistance = lockers.maxOf { it.distance }

        while (lockersMatching.isEmpty()) {
            lockersInRadius = lockers
                .filter { it.distance <= currentRadius }
                .toMutableList()

            if (lockersInRadius.isNotEmpty()) {
                findCandidates()
                if (lockersMatching.isNotEmpty()) {
                    // println("Matching lockers were found:")
                    // println(lockersMatching.joinToString(separator = "\n"){ "• $it" })

                    findClosestMatch()
                }
            }

            if (currentRadius > farthestLockerDistance + search.radiusDelta) {
                throw RuntimeError("No lockers found in the configured search radius expansion.")
            }

            currentRadius += search.radiusDelta
        }
        search.finalRadius = currentRadius

        lockers
            .filter { it !in lockersInRadius }
            .forEach { it.status = LockerStatus.OUT_OF_RADIUS }
    }

    // Finding lockers which are candidates
    private fun findCandidates() {
        lockersMatching = lockersInRadius.filter { locker ->
            val dimensionsFit = lockerFitsItem(locker)

            locker.status = when {
                !locker.available -> LockerStatus.UNAVAILABLE
                dimensionsFit -> LockerStatus.MATCHING
                else -> LockerStatus.UNFITTING
            }

            locker.available && dimensionsFit
        }.toMutableList()
    }

    // Finding closest candidate locker
    private fun findClosestMatch() {
        selectedLocker = lockersMatching.minByOrNull { locker ->
            val volume = locker.maxLength * locker.maxWidth * locker.maxHeight
            val normalizedDistance = locker.distance / lockersMatching.maxOf { it.distance }
            val normalizedVolume = volume / lockersMatching.maxOf { volume }

            (normalizedDistance * 0.5) + (normalizedVolume * 0.5)
        }

        markSelectedLocker()
        // println("Matching locker was found: $selectedLocker")
    }

    private fun markSelectedLocker() {
        selectedLocker?.let {
            it.isSelected = true
            it.status = LockerStatus.SELECTED
        }
    }

    private fun lockerFitsItem(locker: Locker): Boolean {
        return locker.maxWeight >= item.weight &&
                locker.maxLength >= item.length &&
                locker.maxWidth >= item.width &&
                locker.maxHeight >= item.height
    }

    // Haversine geospatial calculation
    private fun haversineDistance(
        lat1: Double, lon1: Double,
        lat2: Double, lon2: Double
    ): Double {
        val earthRadiusMeters = 6371000.0
        val deltaLat = Math.toRadians(lat2 - lat1)
        val deltaLon = Math.toRadians(lon2 - lon1)

        val a = sin(deltaLat / 2).pow(2.0) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(deltaLon / 2).pow(2.0)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return earthRadiusMeters * c
    }
}