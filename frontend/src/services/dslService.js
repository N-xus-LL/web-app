const DSL_BASE = "/api/dsl";

const generateDslScript = ({ 
    lenderLat, lenderLon, 
    borrowerLat, borrowerLon,
    item,
    strategy = "midpoint",
    initialRadius = 100,
    radiusDelta = 100,
    outputMode = "app"
}) => {
    return `lender { lat: ${lenderLat}, lon: ${lenderLon} }
    borrower { lat: ${borrowerLat}, lon: ${borrowerLon} }
    item { weight: ${item.weight}, length: ${item.length}, width: ${item.width}, height: ${item.height} }
    strategy: ${strategy}
    search { initial_radius: ${initialRadius}, radius_delta: ${radiusDelta} }
    output_mode: ${outputMode}`;
};

const executeDslQuery = async (params) => {
    const { lenderLat, lenderLon, borrowerLat, borrowerLon, item, strategy, initialRadius, radiusDelta, outputMode } = params;

    const script = generateDslScript({
        lenderLat, lenderLon,
        borrowerLat, borrowerLon,
        item,
        strategy,
        initialRadius,
        radiusDelta,
        outputMode
    });

    const queryParams = new URLSearchParams({ mode: outputMode });

    const response = await fetch(`${DSL_BASE}/geojson?${queryParams}`, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain",
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        },
        body: script
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
    }

    return response.json();
};

const dslService = { executeDslQuery, generateDslScript };
export default dslService;