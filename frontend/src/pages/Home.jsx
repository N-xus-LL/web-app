import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import itemService from "../services/itemService";
import userService from "../services/userService";

const getItemDate = (item) => item.created_at || item.createdAt || item.updated_at || item.updatedAt || "";

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Value not set";
  }

  return `${value} EUR`;
};

const Home = ({ currentUser }) => {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [itemsResponse, usersResponse] = await Promise.all([
          itemService.getItems(),
          userService.getUsers()
        ]);

        setItems(Array.isArray(itemsResponse) ? itemsResponse : []);
        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      } catch {
        setItems([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const newestItems = useMemo(() => {
    return [...items]
      .sort((first, second) => new Date(getItemDate(second)) - new Date(getItemDate(first)))
      .slice(0, 3);
  }, [items]);

  const availableCount = items.filter((item) => item.available).length;
  const totalValue = items.reduce((sum, item) => {
    const value = Number(item.estimated_value ?? item.estimatedValue ?? 0);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  return (
    <section className="page-section hero">
      <div>
        <p className="eyebrow">Community rentals</p>
        <h1>LendLoop</h1>
        <p className="hero-copy">
          Borrow useful things from people nearby, and lend the items you are not using. A practical shared marketplace for everyday equipment, tools, electronics, and gear.
        </p>

        {currentUser ? (
          <div className="hero-actions">
            <Link className="primary-button" to="/items">
              Browse items
            </Link>
            <Link className="secondary-button" to="/items/new">
              Add item
            </Link>
          </div>
        ) : (
          <div className="hero-actions">
            <Link className="primary-button" to="/register">
              Create account
            </Link>
            <Link className="secondary-button" to="/login">
              Login
            </Link>
          </div>
        )}

        <div className="stats-strip">
          <div className="stat">
            <strong>{loading ? "-" : availableCount}</strong>
            <span>available items</span>
          </div>
          <div className="stat">
            <strong>{loading ? "-" : users.length}</strong>
            <span>community members</span>
          </div>
          <div className="stat">
            <strong>{loading ? "-" : `${totalValue.toFixed(0)} EUR`}</strong>
            <span>listed item value</span>
          </div>
        </div>
      </div>

      <div className="feature-board">
        <article className="feature-card latest-items-card">
          <div className="panel-heading">
            <h2>Newest items</h2>
            <Link className="link-button" to="/items">
              View all
            </Link>
          </div>

          {loading && <p>Loading latest listings...</p>}

          {!loading && newestItems.length === 0 && (
            <p>No items listed yet. Add the first item and it will show here.</p>
          )}

          {!loading && newestItems.length > 0 && (
            <div className="latest-items-list">
              {newestItems.map((item) => (
                <Link className="latest-item-row" key={item.id} to={`/items/${item.id}`}>
                  <div className="latest-item-thumb">
                    {item.images?.[0] ? (
                      <img alt={item.name} src={item.images[0]} />
                    ) : (
                      <span>{item.name?.slice(0, 1) || "I"}</span>
                    )}
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{formatValue(item.estimated_value ?? item.estimatedValue)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="feature-card home-note-card">
          <h3>Ready to share?</h3>
          <p>
            Add photos, condition, value, and location so borrowers can quickly decide whether your item fits what they need.
          </p>
          <Link className="secondary-button small-button" to={currentUser ? "/items/new" : "/login"}>
            {currentUser ? "List an item" : "Login to list"}
          </Link>
        </article>
      </div>
    </section>
  );
};

export default Home;
