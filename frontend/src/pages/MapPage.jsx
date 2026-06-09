import React, { useRef, useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import authService from "../services/authService";
import loanService from "../services/loanService";
import itemService, { ITEM_DATA_CHANGED_EVENT } from "../services/itemService";
import locationService from "../services/locationService";
import geocodingService from "../services/geocodingService";
import { createCircleIcon, createPinIcon } from "../utils/createMapIcons";

const getItemLocation = (item) => item.current_location || item.currentLocation || null;
const getLocationLabel = (location) => location.name || location.address || "Location";

const emptyGeoQuery = {
  lat: "",
  lon: "",
  radius: "100"
};

const MapPage = () => {
  const mapRef = useRef(null);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [currentPosition, setCurrentPosition] = useState([0, 0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [geoQuery, setGeoQuery] = useState(emptyGeoQuery);

  // State for meeting points from active loans
  const [activeMeetings, setActiveMeetings] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const location = useLocation();
  const [pageState, setPageState] = useState(location.state);



  const loadExistingMeetingPoints = async () => {
    try {
      // Get current user ID - you'll need to get this from your auth system
      const currentUser = authService.getCurrentUser();
      if (!currentUser?.user?.id) return;
      
      const userId = String(currentUser.user.id);
      
      // Get both borrowed and lent loans to find all active ones with meeting points
      const [borrowedLoans, lentLoans] = await Promise.all([
        loanService.getBorrowedLoans(userId),
        loanService.getLentLoans(userId)
      ]);
      
      const allLoans = [...(borrowedLoans || []), ...(lentLoans || [])];
      
      // Remove duplicates (in case a loan appears in both arrays - shouldn't happen but just in case)
      const uniqueLoans = Array.from(new Map(allLoans.map(loan => [loan.id, loan])).values());
      
      const meetingPoints = [];
      
      for (const loan of uniqueLoans) {
        // Check if loan has meeting point in metadata
        const metadata = loan.metadata || {};
        
        // Only show meeting points for loans that are in these statuses
        const activeStatuses = ['awaiting_pickup', 'active', 'borrowing_requested'];
        
        if (metadata.meeting_point && activeStatuses.includes(loan.status)) {
          meetingPoints.push({
            loanId: loan.id,
            meetingPoint: metadata.meeting_point,
            lenderPoint: metadata.lender_point,
            borrowerPoint: metadata.borrower_point,
            strategy: metadata.meeting_strategy || 'midpoint',
            confirmed: loan.status !== 'borrowing_requested', // Confirmed if not still in requested state
            status: loan.status,
            updatedAt: Date.now()
          });
        }
      }
      
      if (meetingPoints.length > 0) {
        console.log("📦 Loaded existing meeting points from database:", meetingPoints);
        setActiveMeetings(prev => {
          // Merge with existing meetings, avoiding duplicates
          const existingIds = new Set(prev.map(m => m.loanId));
          const newMeetings = meetingPoints.filter(m => !existingIds.has(m.loanId));
          return [...prev, ...newMeetings];
        });
      }
    } catch (error) {
      console.error("Failed to load existing meeting points:", error);
    }
  };

  // Add this useEffect to load existing meetings when the page loads
  useEffect(() => {
    loadExistingMeetingPoints();
  }, []); // Runs once when MapPage mounts

  // Listen for meeting point updates from LoanDetail
  useEffect(() => {
    const handleMeetingUpdate = (event) => {
      console.log("MapPage received meetingPointUpdated:", event.detail);
      const { loanId, meetingPoint, lenderPoint, borrowerPoint, strategy, isLender, isBorrower } = event.detail;
      
      setActiveMeetings(prev => {
        // Remove existing meeting for this loan if it exists
        const filtered = prev.filter(m => m.loanId !== loanId);
        
        // Add the new meeting
        return [...filtered, {
          loanId,
          meetingPoint,
          lenderPoint,
          borrowerPoint,
          strategy,
          isLender,
          isBorrower,
          updatedAt: Date.now()
        }];
      });
    };

    const handleMeetingConfirmed = (event) => {
      console.log("MapPage received meetingPointConfirmed:", event.detail);
      const { loanId, meetingPoint, lenderPoint, borrowerPoint, strategy, status } = event.detail;
      
      // Keep it on map even after confirmation (status is now AwaitingPickup)
      setActiveMeetings(prev => {
        const filtered = prev.filter(m => m.loanId !== loanId);
        return [...filtered, {
          loanId,
          meetingPoint,
          lenderPoint,
          borrowerPoint,
          strategy,
          confirmed: true,
          status,
          updatedAt: Date.now()
        }];
      });
    };

    window.addEventListener('meetingPointUpdated', handleMeetingUpdate);
    window.addEventListener('meetingPointConfirmed', handleMeetingConfirmed);
    
    // Cleanup old meetings (older than 1 hour)
    const cleanupInterval = setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      setActiveMeetings(prev => prev.filter(m => m.updatedAt > oneHourAgo));
    }, 60 * 1000); // Check every minute

    return () => {
      window.removeEventListener('meetingPointUpdated', handleMeetingUpdate);
      window.removeEventListener('meetingPointConfirmed', handleMeetingConfirmed);
      clearInterval(cleanupInterval);
    };
  }, []);


  const filteredItems = items.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
  );


  const loadItems = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");

    let query = null;
    if (pageState?.searchTerm) {
        setSearchTerm(pageState.searchTerm);
        setPageState(prev => ({
          ...prev,
          searchTerm: ""
        }));
    }
    if (pageState?.point) {
        await setGeoQuery(pageState.point);
        query = pageState.point;
    }
    if (pageState?.circle) {
        await setGeoQuery(pageState.circle);
        query = pageState.circle;
    }

    try {
        console.log(pageState);
      if (pageState?.useClosest) {
          loadClosest(query);
      }
      else {
          const response = pageState?.circle
            ? await itemService.getNearbyItems({
                lat: pageState.circle.lat,
                lon: pageState.circle.lon,
                radius: pageState.circle.radius
              })
            : await itemService.getItems();

            setItems(Array.isArray(response) ? response : []);
      }
    } catch (requestError) {
      setError(requestError.message || "Failed to load items");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadItems();
  }, [pageState]);

  useEffect(() => {
    const refreshItems = () => {
      loadItems({ silent: true });
    };

    const refreshOnStorage = (event) => {
      if (event.key === "lendloop_item_data_changed_at") {
        refreshItems();
      }
    };

    const refreshOnVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshItems();
      }
    };

    window.addEventListener(ITEM_DATA_CHANGED_EVENT, refreshItems);
    window.addEventListener("storage", refreshOnStorage);
    window.addEventListener("focus", refreshItems);
    document.addEventListener("visibilitychange", refreshOnVisibility);

    const intervalId = window.setInterval(refreshItems, 5000);

    return () => {
      window.removeEventListener(ITEM_DATA_CHANGED_EVENT, refreshItems);
      window.removeEventListener("storage", refreshOnStorage);
      window.removeEventListener("focus", refreshItems);
      document.removeEventListener("visibilitychange", refreshOnVisibility);
      window.clearInterval(intervalId);
    };
  }, [pageState]);


  const loadLocations = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await locationService.getLocations();
      setLocations(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
      const watchId = geocodingService.watchPosition(
          (position) => {
              setCurrentPosition([position.latitude, position.longitude]);
          },
          (requestError) => {
              setError(requestError.message || "Could not get your current location.");
          }
      );

      return () => {
          if (watchId !== null) {
              navigator.geolocation.clearWatch(watchId);
          }
      };
  }, []);


  const setGeoCoordinates = (latitude, longitude, hint = "") => {
    setGeoQuery((current) => ({
      ...current,
      lat: String(Number(latitude.toFixed(6))),
      lon: String(Number(longitude.toFixed(6)))
    }));
  };

  const loadClosest = async (query) => {
    try {
      const item = await itemService.getClosestItem(query);
      setItems(item ? [item] : []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load closest item");
    }
  };

  const resetFilters = () => {
    setGeoQuery(emptyGeoQuery);
    setSearchTerm("");
    setPageState(null);
  };



  const meetingPinIcon = useMemo(() => createPinIcon("#00babe", 10, 11), []);  // Cyan for meeting points
  const lenderPinIcon = useMemo(() => createPinIcon("#0087CC", 12, 13), []);   // Blue for lender
  const borrowerPinIcon = useMemo(() => createPinIcon("#72E57C", 14, 15), []); // Green for borrower

  const blue = "#4C9CD1";
  const red = "#ff3333";
  const green = "#7CDE76";
  const yellow = "#fcf403";

  const icons = useMemo(
    () => ({
      redPinIcon: createPinIcon(red, 0, 1),
      bluePinIcon: createPinIcon(blue, 2, 3),
      greenPinIcon: createPinIcon(green, 4, 5),
      blueCircleIcon: createCircleIcon(blue, 6),
      greenCircleIcon: createCircleIcon(green, 7),
      yellowPinIcon: createPinIcon(yellow, 8),

      meetingPinIcon,
      lenderPinIcon,
      borrowerPinIcon
    }),
    [meetingPinIcon, lenderPinIcon, borrowerPinIcon]
  );

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">Locations</p>
        <h1>Map</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* NEW: Show active meetings count in a banner */}
      {activeMeetings.length > 0 && (
        <div className="alert alert-info" style={{ backgroundColor: "#e3f2fd", marginBottom: "12px" }}>
          <strong>Active Meeting Points:</strong> {activeMeetings.length} loan{activeMeetings.length !== 1 ? 's' : ''} with proposed meeting locations.
          {activeMeetings.some(m => !m.confirmed) && " (Click on pins for details)"}
        </div>
      )}

      <div className="map">
      <MapContainer center={[46.55918969285412, 15.63816553469581]} zoom={14} ref={mapRef} style={{height: "480px", width: "min(1120px)" }}>
          <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LayersControl position="topright">
                <LayersControl.Overlay checked name="Items">
                    <LayerGroup>
                    {!loading && items.length > 0 &&
                        filteredItems.map((item) => {
                            const itemLocation = getItemLocation(item);

                            if (itemLocation?.latitude == null || itemLocation?.longitude == null) {
                                return null;
                            }

                            return (
                                <Marker
                                    key={item.id}
                                    position={[itemLocation.latitude, itemLocation.longitude]}
                                    icon={icons.bluePinIcon}
                                    title={item.name}
                                >
                                    <Popup>
                                        <Link to={`/items/${item.id}`}>
                                             {item.name}
                                        </Link>
                                        <br />
                                        {item.description}
                                   </Popup>
                                </Marker>
                            );
                    })}
                    </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="Locations">
                    <LayerGroup>
                      {locations.length > 0 &&
                           locations.map((location) => (
                               <Marker key={location.id || getLocationLabel(location)} position={[location.location.latitude, location.location.longitude]} icon={icons.greenPinIcon} title={getLocationLabel(location)}>
                                  <Popup>
                                     {getLocationLabel(location)}
                                     <br />
                                     {location.locationType}
                                  </Popup>
                               </Marker>
                      ))}
                    </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay checked name="Your Location">
                    <LayerGroup>
                      {currentPosition[0] != 0 && currentPosition[1] != 0 && (
                          <Marker position={currentPosition} icon={icons.redPinIcon} title={"You"}>
                              <Popup>
                                  Your Location
                              </Popup>
                          </Marker>
                      )}
                    </LayerGroup>
                </LayersControl.Overlay>

            {/* Active Meetings Layer */}
            <LayersControl.Overlay checked name="Active Meetings">
              <LayerGroup>
                {activeMeetings.map((meeting, idx) => (
                  <React.Fragment key={`meeting-${meeting.loanId}-${idx}`}>
                    {/* Meeting Point */}
                    {meeting.meetingPoint && (
                      <Marker
                        position={[meeting.meetingPoint.lat, meeting.meetingPoint.lon]}
                        icon={icons.meetingPinIcon}
                      >
                        <Popup>
                          <div style={{ minWidth: "200px" }}>
                            <strong style={{ color: "#FF6B35" }}>📍 Meeting Point</strong>
                            <br />
                            <strong>Loan ID:</strong> {meeting.loanId}
                            <br />
                            <strong>Strategy:</strong> {meeting.strategy}
                            <br />
                            {meeting.meetingPoint.address && (
                              <>
                                <strong>Address:</strong> {meeting.meetingPoint.address}
                                <br />
                              </>
                            )}
                            {meeting.meetingPoint.box_number && (
                              <>
                                <strong>Locker:</strong> #{meeting.meetingPoint.box_number}
                                <br />
                              </>
                            )}
                            <strong>Status:</strong> {meeting.confirmed ? "Confirmed ✓" : "Proposed"}
                            <br />
                            <Link to={`/loans/${meeting.loanId}`}>
                              <button className="small-button" style={{ marginTop: "8px", fontSize: "12px" }}>
                                View Loan Details →
                              </button>
                            </Link>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Lender Point */}
                    {meeting.lenderPoint && (
                      <Marker
                        position={[meeting.lenderPoint.lat, meeting.lenderPoint.lon]}
                        icon={icons.lenderPinIcon}
                      >
                        <Popup>
                          <div>
                            <strong style={{ color: "#0087CC" }}>🏠 Lender's Location</strong>
                            <br />
                            <Link to={`/loans/${meeting.loanId}`}>
                              View Loan
                            </Link>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Borrower Point */}
                    {meeting.borrowerPoint && (
                      <Marker
                        position={[meeting.borrowerPoint.lat, meeting.borrowerPoint.lon]}
                        icon={icons.borrowerPinIcon}
                      >
                        <Popup>
                          <div>
                            <strong style={{ color: "#72E57C" }}>👤 Borrower's Location</strong>
                            <br />
                            <Link to={`/loans/${meeting.loanId}`}>
                              View Loan
                            </Link>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </React.Fragment>
                ))}
              </LayerGroup>
            </LayersControl.Overlay>

          </LayersControl>

          <div className="map-card" position="bottomleft">
            {currentPosition[0] != 0 && currentPosition[1] != 0 && (
            <div>
                <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: red,
                      display: "inline-block",
                      marginRight: "8px"
                    }}
                  />
                Your Location
            </div>
            )}
            <div>
                <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: blue,
                      display: "inline-block",
                      marginRight: "8px"
                    }}
                  />
                Items
            </div>
            <div>
                <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: green,
                      display: "inline-block",
                      marginRight: "8px"
                    }}
                  />
                Locations
            </div>
            {geoQuery?.lat != "" && geoQuery?.lon != "" && (
            <div>
                <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: yellow,
                      display: "inline-block",
                      marginRight: "8px"
                    }}
                  />
                Chosen Location
            </div>
            )}

            {/* NEW: Meeting points in legend */}
            {activeMeetings.length > 0 && (
              <>
                <div>
                  <div style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#FF6B35",
                    display: "inline-block",
                    marginRight: "8px"
                  }} />
                  Meeting Point
                </div>
                <div>
                  <div style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#0087CC",
                    display: "inline-block",
                    marginRight: "8px"
                  }} />
                  Lender Location
                </div>
                <div>
                  <div style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#72E57C",
                    display: "inline-block",
                    marginRight: "8px"
                  }} />
                  Borrower Location
                </div>
              </>
            )}

          </div>

          {geoQuery?.lat != "" && geoQuery?.lon != "" && (
              <Marker position={[Number(geoQuery.lat), Number(geoQuery.lon)]} icon={icons.yellowPinIcon} title={"Chosen location"}>
                  <Popup>
                       {pageState?.addressLocation ? pageState.addressLocation : "Chosen Location"}
                  </Popup>
              </Marker>
          )}
          {pageState?.circle && (
              <Circle center={[Number(pageState?.circle.lat), Number(pageState?.circle.lon)]} radius={Number(pageState?.circle.radius)} dashArray={[10, 10]} color={blue} />
          )}
      </MapContainer>
      </div>
      <div className="map-filter-panel">
        <div className="search-field">
          <label htmlFor="item-search">Search items by name</label>
            <input
              id="item-search"
              placeholder="Type item name..."
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
        </div>
          <button className="secondary-button small-button reset-button" type="button" onClick={resetFilters}>
              Reset Filters
          </button>
      </div>
    </section>
  );
};

export default MapPage;
