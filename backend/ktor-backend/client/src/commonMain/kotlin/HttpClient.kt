package nexus

import io.ktor.client.HttpClient
// import io.ktor.client.engine.ProxyBuilder
// import io.ktor.client.engine.http

val httpClient = HttpClient {
    /* engine {
        proxy = ProxyBuilder.http("http://localhost:5559")
    } */
}
