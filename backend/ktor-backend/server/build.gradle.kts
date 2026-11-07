plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(ktorLibs.plugins.ktor)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.kotlinx.rpc)
}

kotlin {
    jvmToolchain(25)
}

application {
    mainClass = "io.ktor.server.netty.EngineMain"
}

dependencies {
    implementation(ktorLibs.serialization.kotlinx.json)
    implementation(ktorLibs.server.config.yaml)
    implementation(ktorLibs.server.contentNegotiation)
    implementation(ktorLibs.server.core)
    implementation(ktorLibs.server.defaultHeaders)
    implementation(ktorLibs.server.netty)
    implementation(ktorLibs.server.resources)
    implementation(libs.dotenv.kotlin)
    implementation(libs.exposed.core)
    implementation(libs.exposed.dao)
    implementation(libs.exposed.java.time)
    implementation(libs.exposed.jdbc)
    implementation(libs.exposed.json)
    implementation(libs.exposed.kotlin.datetime)
    implementation(libs.h2database.h2)
    implementation(libs.hikaricp)
    implementation(libs.jackson.core)
    implementation(libs.jackson.databind)
    implementation(libs.jbcrypt)
    implementation(libs.kotlinx.datetime)
    implementation(libs.kotlinx.rpc.server)
    implementation(libs.ktor.serialization.kotlinx.json)
    implementation(libs.ktor.server.auth.jwt)
    implementation(libs.ktor.server.content.negotiation)
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.server.netty)
    implementation(libs.postgis.jdbc)
    implementation(libs.postgresql)
    implementation(libs.slf4j.api)
    implementation(platform(libs.guava.bom))
    implementation(platform(libs.netty.bom))
    implementation(project(":core"))
    testImplementation(kotlin("test"))
    testImplementation(ktorLibs.server.testHost)
    testImplementation(libs.kotlinx.rpc.client)
}

configurations.all {
    resolutionStrategy {
        force(libs.jackson2.core)
        force(libs.jackson2.databind)
    }
}
