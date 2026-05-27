import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import itemService from "../services/itemService";

const emptyGeoQuery = {
  lat: "",
  lon: "",
  radius: "5"
};

const ItemManagement = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [geoQuery, setGeoQuery] = useState(emptyGeoQuery);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filteredItems = items.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const loadItems = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await itemService.getItems();
      setItems(Array.isArray(response) ? response : []);
      setSelectedItem(null);
    } catch (requestError) {
      setError(requestError.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleGeoChange = (event) => {
    const { name, value } = event.target;
    setGeoQuery((current) => ({ ...current, [name]: value }));
  };

  const clearStatus = () => {
    setError("");
    setMessage("");
  };

  const viewItem = async (id) => {
    clearStatus();
    setSaving(`view-${id}`);

    try {
      const item = await itemService.getItem(id);
      setSelectedItem(item);
      setMessage(`Loaded item: ${item.name}`);
    } catch (requestError) {
      setError(requestError.message || "Failed to load item");
    } finally {
      setSaving("");
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) {
      return;
    }

    clearStatus();
    setSaving(`delete-${id}`);

    try {
      await itemService.deleteItem(id);
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
    setSaving("nearby");

    try {
      const response = await itemService.getNearbyItems(geoQuery);
      setItems(Array.isArray(response) ? response : []);
      setSelectedItem(null);
      setMessage("Nearby items loaded.");
    } catch (requestError) {
      setError(requestError.message || "Failed to load nearby items");
    } finally {
      setSaving("");
    }
  };

  const loadClosest = async () => {
    clearStatus();
    setSaving("closest");

    try {
      const item = await itemService.getClosestItem(geoQuery);
      setItems(item ? [item] : []);
      setSelectedItem(item);
      setMessage("Closest item loaded.");
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

        <div className="filter-fields">
          <div className="field compact-field">
            <label htmlFor="lat">Lat</label>
            <input id="lat" name="lat" type="number" step="any" value={geoQuery.lat} onChange={handleGeoChange} />
          </div>
          <div className="field compact-field">
            <label htmlFor="lon">Lon</label>
            <input id="lon" name="lon" type="number" step="any" value={geoQuery.lon} onChange={handleGeoChange} />
          </div>
          <div className="field compact-field">
            <label htmlFor="radius">Radius</label>
            <input id="radius" name="radius" type="number" step="any" value={geoQuery.radius} onChange={handleGeoChange} />
          </div>
        </div>

        <div className="filter-actions">
          <button className="secondary-button small-button" disabled={saving === "nearby"} type="submit">
            Nearby
          </button>
          <button className="secondary-button small-button" disabled={saving === "closest"} type="button" onClick={loadClosest}>
            Closest
          </button>
          <button className="link-button" type="button" onClick={loadItems}>
            Reset
          </button>
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
            <article className="item-card" key={item.id}>
              <div className="item-image">
                {item.images?.[0] ? (
                  <img alt={item.name} src={item.images[0]} />
                ) : (
                  <span>{item.name?.slice(0, 1) || "I"}</span>
                )}
              </div>
              <div className="item-body">
                <div className="item-title-row">
                  <h2>{item.name}</h2>
                  <span className={item.available ? "status status-open" : "status status-closed"}>
                    {item.available ? "Available" : "Unavailable"}
                  </span>
                </div>
                <p>{item.description || "No description added."}</p>
                <div className="item-meta">
                  <span>Value: {item.estimated_value ?? item.estimatedValue ?? "Not set"}</span>
                  <span>ID: {item.id}</span>
                </div>
                <div className="button-row">
                  <button className="secondary-button small-button" type="button" onClick={() => viewItem(item.id)}>
                    {saving === `view-${item.id}` ? "Loading..." : "View"}
                  </button>
                  <Link className="secondary-button small-button" to={`/items/${item.id}/edit`}>
                    Edit
                  </Link>
                  <button className="danger-button small-button" type="button" onClick={() => deleteItem(item.id)}>
                    {saving === `delete-${item.id}` ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="resource-panel detail-panel">
          <h2>Selected item</h2>
          <pre>{JSON.stringify(selectedItem, null, 2)}</pre>
        </div>
      )}
    </section>
  );
};

export default ItemManagement;
