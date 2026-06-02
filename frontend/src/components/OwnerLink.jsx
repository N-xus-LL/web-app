import React from "react";
import { Link } from "react-router-dom";

const OwnerLink = ({ ownerId, username }) => {
  const label = username || "Unknown user";

  if (!ownerId) {
    return <span>{label}</span>;
  }

  return (
    <Link className="owner-link" to={`/users/${ownerId}`}>
      {label}
    </Link>
  );
};

export default OwnerLink;
