import React, { useEffect, useState } from "react";
import itemService from "../services/itemService";

const ItemManagement = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filteredItems = items.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await itemService.getItems();
        setItems(Array.isArray(response) ? response : []);
      } catch (requestError) {
        setError(requestError.message || "Failed to load items");
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">Inventory</p>
        <h1>Item Management</h1>
      </div>

      {loading && <div className="state-panel">Loading items...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="state-panel">
          No items found yet. Once the database has items, they will appear here.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="items-toolbar">
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
            <div className="items-count">
              {filteredItems.length} of {items.length} items
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="state-panel">No items match &quot;{searchTerm}&quot;.</div>
          ) : (
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
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ItemManagement;
