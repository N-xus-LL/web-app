import React from "react";
import { Link } from "react-router-dom";
import OwnerLink from "./OwnerLink";
import { getItemOwnerId } from "../utils/userDisplay";

const ItemCard = ({ item, currentUserId, usernameById, onDelete, deleting }) => {
  const ownerId = getItemOwnerId(item);
  const ownerUsername = ownerId ? usernameById[ownerId] || "Unknown user" : "Unknown user";
  const isOwner = Boolean(currentUserId) && ownerId === String(currentUserId);

  return (
    <article className="item-card">
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
          <span>Value: {item.estimated_value ?? item.estimatedValue ?? "Not set"}€</span>
          <span>
            Owner: <OwnerLink ownerId={ownerId} username={ownerUsername} />
          </span>
        </div>
        <div className="button-row">
          <Link className="secondary-button small-button" to={`/items/${item.id}`}>
            View
          </Link>
          {isOwner && onDelete && (
            <>
              <Link className="secondary-button small-button" to={`/items/${item.id}/edit`}>
                Edit
              </Link>
              <button className="danger-button small-button" type="button" onClick={() => onDelete(item)}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default ItemCard;
