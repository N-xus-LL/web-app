import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  categoryOptions,
  damagePolicyOptions,
  itemConditionOptions
} from "../constants/referenceData";
import itemService from "../services/itemService";
import userService from "../services/userService";

const getItemOwnerId = (item) => String(item?.owner_id ?? item?.ownerId ?? "");

const buildUsernameMap = (users) => {
  const map = {};

  users.forEach((user) => {
    if (user?.id != null && user?.username) {
      map[String(user.id)] = user.username;
    }
  });

  return map;
};

const getItemLocation = (item) => item.current_location || item.currentLocation || {};

const getOptionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || value || "Not set";

const ItemDetail = ({ currentUser }) => {
  const { id } = useParams();
  const currentUserId = currentUser?.user?.id;
  const [item, setItem] = useState(null);
  const [usernameById, setUsernameById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    const loadItem = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await itemService.getItem(id);
        setItem(response);
      } catch (requestError) {
        setError(requestError.message || "Failed to load item");
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadItem();
    }
  }, [id]);

  const ownerId = item ? getItemOwnerId(item) : "";
  const ownerUsername = ownerId ? usernameById[ownerId] || "Unknown user" : "Unknown user";
  const isOwner = Boolean(currentUserId) && ownerId === String(currentUserId);
  const location = item ? getItemLocation(item) : {};
  const imageUrl = item?.images?.[0];

  return (
    <section className="page-section">
      <div className="page-heading page-heading-row">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>{item?.name || "Item details"}</h1>
        </div>
        <Link className="secondary-button" to="/items">
          Back to items
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="state-panel">Loading item...</div>}

      {!loading && !error && item && (
        <article className="item-detail-page">
          <div className="item-detail-image-panel">
            {imageUrl ? (
              <img alt={item.name} className="item-detail-image" src={imageUrl} />
            ) : (
              <div className="item-detail-image-placeholder">
                <span>{item.name?.slice(0, 1) || "I"}</span>
              </div>
            )}
          </div>

          <div className="item-detail-content">
            <div className="item-title-row">
              <h2>{item.name}</h2>
              <span className={item.available ? "status status-open" : "status status-closed"}>
                {item.available ? "Available" : "Unavailable"}
              </span>
            </div>

            <p className="item-detail-description">
              {item.description || "No description added."}
            </p>

            <dl className="item-detail-facts">
              <div>
                <dt>Owner</dt>
                <dd>{ownerUsername}</dd>
              </div>
              <div>
                <dt>Estimated value</dt>
                <dd>{item.estimated_value ?? item.estimatedValue ?? "Not set"}</dd>
              </div>
              <div>
                <dt>Condition</dt>
                <dd>{getOptionLabel(itemConditionOptions, item.condition_id || item.conditionId)}</dd>
              </div>
              <div>
                <dt>Damage policy</dt>
                <dd>
                  {getOptionLabel(
                    damagePolicyOptions,
                    item.default_damage_policy_id || item.defaultDamagePolicyId
                  )}
                </dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{getOptionLabel(categoryOptions, item.category_id || item.categoryId)}</dd>
              </div>
              {location.latitude != null && location.longitude != null && (
                <div>
                  <dt>Location</dt>
                  <dd>
                    {Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)}
                  </dd>
                </div>
              )}
            </dl>

            {isOwner && (
              <div className="button-row">
                <Link className="primary-button" to={`/items/${item.id}/edit`}>
                  Edit item
                </Link>
              </div>
            )}
          </div>
        </article>
      )}
    </section>
  );
};

export default ItemDetail;
