import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ItemCard from "../components/ItemCard";
import userService from "../services/userService";
import itemService from "../services/itemService";
import { buildUsernameMap, getItemOwnerId } from "../utils/userDisplay";

const UserItems = ({ currentUser }) => {
  const currentUserId = currentUser?.user?.id;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState("");
  const [usernameById, setUsernameById] = useState({});

  const clearStatus = () => {
    setError("");
    setMessage("");
  };

  const loadUserItems = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await itemService.getItems(currentUserId);

      setItems(Array.isArray(response) ? response.filter(item => {return item.owner_id === currentUserId}) : []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserItems();
  }, []);


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
      await loadUserItems();
    } catch (requestError) {
      setError(requestError.message || "Failed to delete item");
    } finally {
      setSaving("");
    }
  };

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

  return (
    <section className="page-section">
      <div className="page-heading page-heading-row">
        <div>
          <p className="eyebrow">Items</p>
          <h1>My Items</h1>
        </div>
        <Link className="primary-button" to="/items/new">
          Create item
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="items-summary-row">
        <span>{items.length} items</span>
      </div>

      {loading && <div className="state-panel">Loading items...</div>}

      {!loading && items.length === 0 && (
        <div className="state-panel">No items found.</div>
      )}

      {!loading && items.length > 0 && (
        <div className="item-grid">
          {items.map((item) => (
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

export default UserItems;