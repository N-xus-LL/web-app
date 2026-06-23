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

// Helper to parse points from DSL response
const parsePointsFromResponse = (geojson, currentUserId, lenderId, borrowerId) => {
    if (!geojson?.features) return { meetingPoint: null, userPoint: null, otherPartyPoint: null };
    
    let meetingPoint    = null;
    let userPoint       = null;
    let otherPartyPoint = null;
    
    geojson.features.forEach(feature => {
        const coordinates = feature.geometry.coordinates;
        const [lon, lat] = coordinates;
        const props = feature.properties || {};
        
        // Meeting point could be a locker or a calculated point
        if (props.kind === 'locker' || (props.role === 'meeting' || props.kind === 'meeting')) {
            meetingPoint = { lat, lon, ...props };
        }
        
        // Lender point
        else if (props.role === 'lender') {
            if (currentUserId === lenderId) {
                userPoint = { lat, lon, role: 'lender', ...props };
            } else {
                otherPartyPoint = { lat, lon, role: 'lender', ...props };
            }
        }

        // Borrower point
        else if (props.role === 'borrower') {
            if (currentUserId === borrowerId) {
                userPoint = { lat, lon, role: 'borrower', ...props };
            } else {
                otherPartyPoint = { lat, lon, role: 'borrower', ...props };
            }
        }
    });
    
    return { meetingPoint, userPoint, otherPartyPoint };
};

const dslService = { 
    executeDslQuery, 
    generateDslScript,
    parsePointsFromResponse
};

export default dslService;