import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import itemService from "../services/itemService";
import ItemCard from "../components/ItemCard";
import locationService from "../services/locationService";
import L from 'leaflet';

const MapPage = () => {
  const mapRef = useRef(null);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
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
    loadItems();
  }, []);

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

  const customIcon = L.Icon.extend({
      options: {
        shadowUrl: "/src/images/marker-shadow.svg",
        iconSize: [24, 38],
        shadowSize: [40, 40],
        shadowAnchor: [13, 21]
      }
  });

  const greenIcon = new customIcon({iconUrl: '/src/images/marker-icon-green.png'});
  const redIcon = new customIcon({iconUrl: '/src/images/marker-icon-red.png'});
  const blueIcon = new customIcon({iconUrl: '/src/images/marker-icon-blue.png'});
  const yellowIcon = new customIcon({iconUrl: '/src/images/marker-icon-yellow.png'});

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
          {!loading && items.length > 0 &&
              items.map((item) => (
                  <Marker position={[item.current_location.latitude, item.current_location.longitude]} icon={blueIcon}>
                      <Popup>
                          <Link to={`/items/${item.id}`}>
                               {item.name}
                          </Link>
                          <br />
                          {item.description}
                      </Popup>
                  </Marker>
          ))}
          {!loading && locations.length > 0 &&
               locations.map((location) => (
                   <Marker position={[location.location.latitude, location.location.longitude]} icon={greenIcon}>
                      <Popup>
                         {location.name}
                         <br />
                         {location.locationType}
                      </Popup>
                   </Marker>
          ))}
      </MapContainer>
      </div>
    </section>
  );
};

export default MapPage;
