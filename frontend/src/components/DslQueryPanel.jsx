// components/DslQueryPanel.jsx
import React, { useState, useEffect } from "react";
import geocodingService from "../services/geocodingService";
import itemService from "../services/itemService";
import loanService from "../services/loanService";

const DslQueryPanel = (
    { onQueryExecute, onLoading, onError, selectedItemId, selectedLoanId }
) => {
    const [lenderLocation, setLenderLocation]     = useState({ lat: "", lon: "", address: "" });
    const [borrowerLocation, setBorrowerLocation] = useState({ lat: "", lon: "", address: "" });
    const [item, setItem] = useState({ weight: "", length: "", width: "", height: "" });
    const [strategy, setStrategy] = useState("midpoint");
    const [initialRadius, setInitialRadius] = useState(100);
    const [radiusDelta, setRadiusDelta] = useState(100);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [useCurrentLocation, setUseCurrentLocation] = useState({ lender: false, borrower: false });

    const strategies = ["near_borrower", "midpoint", "near_lender", "custom"];

    // Load item details if selected
    useEffect(() => {
        if (selectedItemId) {
            const loadItem = async () => {
                try {
                const itemData = await itemService.getItem(selectedItemId);
                setItem({
                    weight: itemData.weight_kg || itemData.weight || "",
                    length: itemData.length_cm || itemData.length || "",
                    width: itemData.width_cm || itemData.width || "",
                    height: itemData.height_cm || itemData.height || ""
                });
                } catch (err) {
                console.error("Failed to load item:", err);
                }
            };

            loadItem();
        }
    }, [selectedItemId]);

    // Load loan details if selected (to get lender/borrower locations)
    useEffect(() => {
        if (selectedLoanId) {
            const loadLoan = async () => {
                try {
                const loan = await loanService.getLoan(selectedLoanId);
                // Assuming loan has lender and borrower with location info
                if (loan.lender?.location) {
                    setLenderLocation({
                    lat: loan.lender.location.latitude,
                    lon: loan.lender.location.longitude,
                    address: loan.lender.location.address
                    });
                }
                if (loan.borrower?.location) {
                    setBorrowerLocation({
                    lat: loan.borrower.location.latitude,
                    lon: loan.borrower.location.longitude,
                    address: loan.borrower.location.address
                    });
                }
                } catch (err) {
                console.error("Failed to load loan:", err);
                }
            };

            loadLoan();
        }
    }, [selectedLoanId]);

    const handleAddressGeocode = async (type, address) => {
        setIsGeocoding(true);
        try {
            const result = await geocodingService.geocodeAddress(address);
            if (result) {
                const locationUpdate = {
                lat: result.latitude,
                lon: result.longitude,
                address: address
                };
                if (type === "lender") {
                setLenderLocation(locationUpdate);
                } else {
                setBorrowerLocation(locationUpdate);
                }
            } else {
                onError?.(`Address not found: ${address}`);
            }
        } catch (err) {
            onError?.(err.message);
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleUseCurrentLocation = async (type) => {
        try {
            const position = await geocodingService.getCurrentPosition();
            const locationUpdate = {
                lat: position.latitude,
                lon: position.longitude,
                address: "Current Location"
            };

            if (type === "lender") {
                setLenderLocation(locationUpdate);
                setUseCurrentLocation(prev => ({ ...prev, lender: true }));
            } else {
                setBorrowerLocation(locationUpdate);
                setUseCurrentLocation(prev => ({ ...prev, borrower: true }));
            }
        } catch (err) {
            onError?.(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!lenderLocation.lat || !lenderLocation.lon) {
            onError?.("Please provide lender location");
            return;
        }

        if (!borrowerLocation.lat || !borrowerLocation.lon) {
            onError?.("Please provide borrower location");
            return;
        }

        if (!item.weight || !item.length || !item.width || !item.height) {
            onError?.("Please provide all item dimensions");
            return;
        }

        onLoading?.(true);
        try {
            const geoJson = await dslService.executeDslQuery({
                lenderLat: parseFloat(lenderLocation.lat),
                lenderLon: parseFloat(lenderLocation.lon),
                borrowerLat: parseFloat(borrowerLocation.lat),
                borrowerLon: parseFloat(borrowerLocation.lon),
                item: {
                weight: parseFloat(item.weight),
                length: parseFloat(item.length),
                width: parseFloat(item.width),
                height: parseFloat(item.height)
                },
                strategy,
                initialRadius: parseFloat(initialRadius),
                radiusDelta: parseFloat(radiusDelta),
                outputMode: "app"
            });
            
            onQueryExecute?.(geoJson);
        } catch (err) {
            onError?.(err.message);
        } finally {
            onLoading?.(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="dsl-query-panel">
        <h3>Find Compatible Lockers</h3>
        
        {/* Lender Location */}
        <div className="form-section">
            <h4>Lender Location</h4>
            <div className="location-input">
            <input
                type="text"
                placeholder="Address"
                value={lenderLocation.address}
                onChange={(e) => setLenderLocation({ ...lenderLocation, address: e.target.value })}
            />
            <button type="button" onClick={() => handleAddressGeocode("lender", lenderLocation.address)}>
                Geocode
            </button>
            <button type="button" onClick={() => handleUseCurrentLocation("lender")}>
                Use My Location
            </button>
            </div>
            <div className="coord-input">
            <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={lenderLocation.lat}
                onChange={(e) => setLenderLocation({ ...lenderLocation, lat: e.target.value })}
            />
            <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={lenderLocation.lon}
                onChange={(e) => setLenderLocation({ ...lenderLocation, lon: e.target.value })}
            />
            </div>
        </div>

        {/* Borrower Location */}
        <div className="form-section">
            <h4>Borrower Location</h4>
            <div className="location-input">
            <input
                type="text"
                placeholder="Address"
                value={borrowerLocation.address}
                onChange={(e) => setBorrowerLocation({ ...borrowerLocation, address: e.target.value })}
            />
            <button type="button" onClick={() => handleAddressGeocode("borrower", borrowerLocation.address)}>
                Geocode
            </button>
            <button type="button" onClick={() => handleUseCurrentLocation("borrower")}>
                Use My Location
            </button>
            </div>
            <div className="coord-input">
            <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={borrowerLocation.lat}
                onChange={(e) => setBorrowerLocation({ ...borrowerLocation, lat: e.target.value })}
            />
            <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={borrowerLocation.lon}
                onChange={(e) => setBorrowerLocation({ ...borrowerLocation, lon: e.target.value })}
            />
            </div>
        </div>

        {/* Item Dimensions */}
        <div className="form-section">
            <h4>Item Dimensions</h4>
            <div className="dimensions">
            <input
                type="number"
                step="any"
                placeholder="Weight (kg)"
                value={item.weight}
                onChange={(e) => setItem({ ...item, weight: e.target.value })}
            />
            <input
                type="number"
                step="any"
                placeholder="Length (cm)"
                value={item.length}
                onChange={(e) => setItem({ ...item, length: e.target.value })}
            />
            <input
                type="number"
                step="any"
                placeholder="Width (cm)"
                value={item.width}
                onChange={(e) => setItem({ ...item, width: e.target.value })}
            />
            <input
                type="number"
                step="any"
                placeholder="Height (cm)"
                value={item.height}
                onChange={(e) => setItem({ ...item, height: e.target.value })}
            />
            </div>
        </div>

        {/* Strategy and Search Parameters */}
        <div className="form-section">
            <h4>Search Strategy</h4>
            <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            {strategies.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            <div className="search-params">
            <label>
                Initial Radius (m):
                <input
                type="number"
                value={initialRadius}
                onChange={(e) => setInitialRadius(e.target.value)}
                step="50"
                />
            </label>
            <label>
                Radius Delta (m):
                <input
                type="number"
                value={radiusDelta}
                onChange={(e) => setRadiusDelta(e.target.value)}
                step="50"
                />
            </label>
            </div>
        </div>

        <button type="submit" disabled={isGeocoding}>
            Find Lockers
        </button>
        </form>
    );
};

export default DslQueryPanel;