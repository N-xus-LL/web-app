plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(ktorLibs.plugins.ktor)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.kotlinx.rpc)
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(25))
    }
}

application {
    mainClass = "io.ktor.server.netty.EngineMain"
}

val ktorVersion = "3.4.3"
val exposedVersion = "1.2.0"
val postgresVersion = "18.3"
val postgisVersion = "0.7.0"

dependencies {
    implementation(project(":core"))
    implementation(ktorLibs.serialization.kotlinx.json)
    implementation(ktorLibs.server.config.yaml)
    implementation(ktorLibs.server.contentNegotiation)
    implementation(ktorLibs.server.core)
    implementation(ktorLibs.server.defaultHeaders)
    implementation(ktorLibs.server.netty)
    implementation(ktorLibs.server.resources)
    implementation(libs.h2database.h2)
    implementation(libs.kotlinx.rpc.server)
    implementation(libs.postgresql)
    implementation(libs.exposed.core)
    implementation(libs.exposed.jdbc)
    implementation("org.slf4j:slf4j-nop:2.0.18") // Overrides 'SLF4J(W): No SLF4J providers were found.' exception
    implementation("org.jetbrains.exposed:exposed-json:1.2.0")
    implementation("org.jetbrains.exposed:exposed-java-time:1.2.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:1.2.0")

    testImplementation(kotlin("test"))
    testImplementation(ktorLibs.server.testHost)
    testImplementation(libs.kotlinx.rpc.client)


    // --- Ktor Server Core ---
    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")

    // --- Exposed Core & DB Connection ---
    implementation("org.jetbrains.exposed:exposed-core:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-dao:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-jdbc:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-json:$exposedVersion")
    implementation("org.postgresql:postgresql:$postgresVersion")
    implementation("com.zaxxer:HikariCP:5.1.0")

    // --- Specialized Exposed Support ---
    // implementation("org.jetbrains.exposed:exposed-kotlin-uuid:$exposedVersion")
    implementation("org.jetbrains.exposed:exposed-kotlin-datetime:$exposedVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.0")

    // --- Serialization (Required for JSONB and GeoJSON) ---
    implementation("io.ktor:ktor-server-content-negotiation:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktorVersion")

    // Required for: metadata JSONB
    // implementation("org.jetbrains.exposed:exposed-jdbc:$exposedVersion")

    // --- PostGIS / Spatial Support ---
    // Note: Exposed doesn't have official PostGIS support.
    //       Most developers use below standard community library.
    // implementation("com.github.tpguy84:exposed-postgis:$postgisVersion")

    implementation("io.github.cdimascio:dotenv-kotlin:6.5.1")   // dotenv
    implementation("io.ktor:ktor-server-auth-jwt-jvm")  // Ktor JWT Authentication
    implementation("org.mindrot:jbcrypt:0.4")   // BCrypt for password hashing
}
