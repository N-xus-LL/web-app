import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import geocodingService from "../services/geocodingService";
import ItemCard from "../components/ItemCard";
import itemService from "../services/itemService";
import userService from "../services/userService";
import { buildUsernameMap, getItemOwnerId } from "../utils/userDisplay";

const emptyGeoQuery = {
  lat: "",
  lon: "",
  radius: "5"
};

const ItemManagement = ({ currentUser }) => {
  const currentUserId = currentUser?.user?.id;
  const [items, setItems] = useState([]);
  const [geoQuery, setGeoQuery] = useState(emptyGeoQuery);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [usernameById, setUsernameById] = useState({});
  const [usingNearby, setUsingNearby] = useState(false);

  const filteredItems = items.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

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

  useEffect(() => {
    const loadUsernames = async () => {
      try {
        const response = await userService.getUsers();
        setUsernameById(buildUsernameMap(Array.isArray(response) ? response : []));
      } catch {
        setUsernameById({});
      }
    };

    loadUsernames();
  }, []);

  const handleGeoChange = (event) => {
    const { name, value } = event.target;
    setGeoQuery((current) => ({ ...current, [name]: value }));
  };

  const clearStatus = () => {
    setError("");
    setMessage("");
  };

  const setGeoCoordinates = (latitude, longitude, hint = "") => {
    setGeoQuery((current) => ({
      ...current,
      lat: String(Number(latitude.toFixed(6))),
      lon: String(Number(longitude.toFixed(6)))
    }));
    setLocationHint(hint || `Search location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    clearStatus();
    setLocationHint("");

    try {
      const position = await geocodingService.getCurrentPosition();
      setGeoCoordinates(position.latitude, position.longitude, "Using your current location.");
    } catch (requestError) {
      setError(requestError.message || "Could not get your current location.");
    } finally {
      setLocating(false);
    }
  };

  const handleAddressSearch = async (event) => {
    event.preventDefault();
    setGeocoding(true);
    clearStatus();
    setLocationHint("");

    try {
      const result = await geocodingService.geocodeAddress(addressQuery);

      if (!result) {
        setError("Address not found. Try a more specific address.");
        return;
      }

      setGeoCoordinates(result.latitude, result.longitude, result.label);
    } catch (requestError) {
      setError(requestError.message || "Address search failed.");
    } finally {
      setGeocoding(false);
    }
  };

  const resetFilters = () => {
    setGeoQuery(emptyGeoQuery);
    setAddressQuery("");
    setLocationHint("");
    loadItems();
    setUsingNearby(false);
  };

  const ensureSearchLocation = () => {
    if (!geoQuery.lat || !geoQuery.lon) {
      setError("Set a search location using your address or current position.");
      return false;
    }

    return true;
  };

  const deleteItem = async (item) => {
    if (!currentUserId || getItemOwnerId(item) !== String(currentUserId)) {
      setError("You can only delete items that belong to you.");
      return;
    }

    if (!window.confirm("Delete this item?")) {
      return;
    }

    clearStatus();
    setSaving(`delete-${item.id}`);

    try {
      await itemService.deleteItem(item.id);
      setMessage("Item deleted.");
      await loadItems();
    } catch (requestError) {
      setError(requestError.message || "Failed to delete item");
    } finally {
      setSaving("");
    }
  };

  const loadNearby = async (event) => {
    event.preventDefault();
    clearStatus();

    if (!ensureSearchLocation()) {
      return;
    }

    setSaving("nearby");

    try {
      const response = await itemService.getNearbyItems(geoQuery);
      setItems(Array.isArray(response) ? response : []);
      setMessage("Nearby items loaded.");
      setUsingNearby(true);
    } catch (requestError) {
      setError(requestError.message || "Failed to load nearby items");
    } finally {
      setSaving("");
    }
  };

  const loadClosest = async () => {
    clearStatus();

    if (!ensureSearchLocation()) {
      return;
    }

    setSaving("closest");

    try {
      const item = await itemService.getClosestItem(geoQuery);
      setItems(item ? [item] : []);
      setMessage("Closest item loaded.");
      setUsingNearby(false);
    } catch (requestError) {
      setError(requestError.message || "Failed to load closest item");
    } finally {
      setSaving("");
    }
  };

  return (
    <section className="page-section">
      <div className="page-heading page-heading-row">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>Item Management</h1>
        </div>
        <Link className="primary-button" to="/items/new">
          Create item
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <form className="items-filter-panel" onSubmit={loadNearby}>
        <div className="search-field">
          <label htmlFor="item-search">Search by name</label>
          <input
            id="item-search"
            placeholder="Type item name..."
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="filter-location-block">
          <div className="field compact-field">
            <label htmlFor="filter-address">Search location</label>
            <input
              id="filter-address"
              placeholder="Type an address..."
              type="text"
              value={addressQuery}
              onChange={(event) => setAddressQuery(event.target.value)}
            />
          </div>
          <div className="button-row location-button-row">
            <button
              className="secondary-button small-button"
              disabled={geocoding || !addressQuery.trim()}
              type="button"
              onClick={handleAddressSearch}
            >
              {geocoding ? "Searching..." : "Find from address"}
            </button>
            <button
              className="secondary-button small-button"
              disabled={locating}
              type="button"
              onClick={handleUseCurrentLocation}
            >
              {locating ? "Getting location..." : "Use my location"}
            </button>
          </div>
          {locationHint && <p className="location-hint">{locationHint}</p>}
          <div className="filter-radius-row">
            {geoQuery.lat && geoQuery.lon && (
              <p className="coords-display">
                Lat {geoQuery.lat}, Lon {geoQuery.lon}
              </p>
            )}
            <div className="field compact-field filter-radius-field">
              <label htmlFor="radius">Radius (m)</label>
              <input id="radius" name="radius" type="number" min="0" step="any" value={geoQuery.radius} onChange={handleGeoChange} />
            </div>
          </div>
        </div>

        <div className="filter-actions">
          <button className="secondary-button small-button" disabled={saving === "nearby"} type="submit">
            Nearby
          </button>
          <button className="secondary-button small-button" disabled={saving === "closest"} type="button" onClick={loadClosest}>
            Closest
          </button>
          <button className="link-button" type="button" onClick={resetFilters}>
            Reset
          </button>
          {usingNearby ? (
                  <Link className="secondary-button small-button button-to-right" to="/map" state={{ items:items, circle:geoQuery }}>
                        Show on map
                  </Link>
                ) : (
                  <Link className="secondary-button small-button button-to-right" to="/map" state={{ items }}>
                       Show on map
                  </Link>
                )}
        </div>
      </form>

      <div className="items-summary-row">
        <span>{filteredItems.length} of {items.length} items</span>
      </div>

      {loading && <div className="state-panel">Loading items...</div>}

      {!loading && items.length === 0 && (
        <div className="state-panel">No items found.</div>
      )}

      {!loading && items.length > 0 && filteredItems.length === 0 && (
        <div className="state-panel">No items match &quot;{searchTerm}&quot;.</div>
      )}

      {!loading && filteredItems.length > 0 && (
        <div className="item-grid">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              currentUserId={currentUserId}
              deleting={saving === `delete-${item.id}`}
              item={item}
              usernameById={usernameById}
              onDelete={deleteItem}
            />
          ))}
        </div>
      )}

    </section>
  );
};

export default ItemManagement;
