import React, { useRef, useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
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

  const location = useLocation();
  const [pageState, setPageState] = useState(location.state);

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
        yellowPinIcon: createPinIcon(yellow, 8)
      }),
      []
    );

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">Locations</p>
        <h1>Map</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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
