import React, { useRef, useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import itemService from "../services/itemService";
import ItemCard from "../components/ItemCard";
import locationService from "../services/locationService";
import L from 'leaflet';
import geocodingService from "../services/geocodingService";
import {
  createCircleIcon,
  createPinIcon
} from "../utils/createMapIcons";

const MapPage = () => {
  const mapRef = useRef(null);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [currentPosition, setCurrentPosition] = useState([0, 0]);

  var {state} = useLocation();

  const loadItems = async () => {
    setLoading(true);
    setError("");

    try {
        const response = await itemService.getItems();
        setItems(Array.isArray(response) ? response : []);
    } catch (requestError) {
        setError(requestError.message || "Failed to load items");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
      if (!state?.items) {
        loadItems();
      } else {
        setItems(state.items);
      }
  }, [state]);


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

  const getCurrentLocation = async () => {
      try {
          const position = await geocodingService.getCurrentPosition();
          setCurrentPosition([position.latitude, position.longitude]);
      } catch (requestError) {
          setError(requestError.message || "Could not get your current location.");
      }
  }
  useEffect(() => {
      const interval = setInterval(() => {
          getCurrentLocation();
      }, 5000);

      return () => clearInterval(interval);
  }, []);

    const blue = "#4C9CD1";
    const red = "#ff3333";
    const green = "#7CDE76";

    const icons = useMemo(
      () => ({
        redPinIcon: createPinIcon(red),
        bluePinIcon: createPinIcon(blue),
        greenPinIcon: createPinIcon(green),
        blueCircleIcon: createCircleIcon(blue),
        greenCircleIcon: createCircleIcon(green)
      }),
      []
    );

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">Locations</p>
        <h1>Map</h1>
      </div>

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
                        items.map((item) => (
                            <Marker position={[item.current_location.latitude, item.current_location.longitude]} icon={icons.bluePinIcon} title={item.name}>
                                <Popup>
                                    <Link to={`/items/${item.id}`}>
                                         {item.name}
                                    </Link>
                                    <br />
                                    {item.description}
                               </Popup>
                            </Marker>
                    ))}
                    </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="Locations">
                    <LayerGroup>
                      {!loading && locations.length > 0 &&
                           locations.map((location) => (
                               <Marker position={[location.location.latitude, location.location.longitude]} icon={icons.greenCircleIcon} title={location.name}>
                                  <Popup>
                                     {location.name}
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
          </div>

          {state?.circle && (
              <Circle center={[state?.circle.lat, state?.circle.lon]} radius={state?.circle.radius} dashArray={[10, 10]} color={blue} />
          )}
      </MapContainer>
      </div>
    </section>
  );
};

export default MapPage;
