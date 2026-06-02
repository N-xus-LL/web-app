import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import userService from "../services/userService";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await userService.getUsers();
        setUsers(Array.isArray(response) ? response : []);
      } catch (requestError) {
        setError(requestError.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">Community</p>
        <h1>Users</h1>
      </div>

      {loading && <div className="state-panel">Loading users...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && users.length === 0 && (
        <div className="state-panel">No users found.</div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="user-grid">
          {users.map((user) => (
            <Link className="user-card user-card-link" key={user.id} to={`/users/${user.id}`}>
              <div className="user-avatar">{user.username?.slice(0, 1) || "U"}</div>
              <div>
                <h2>{user.username}</h2>
                <p>{user.first_name || user.firstName} {user.last_name || user.lastName}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default Users;
