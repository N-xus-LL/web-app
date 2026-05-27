import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ItemCard from "../components/ItemCard";
import itemService from "../services/itemService";
import loanService from "../services/loanService";
import userService from "../services/userService";
import { buildUsernameMap } from "../utils/userDisplay";
import { loanStatusOptions } from "../constants/referenceData";

const getLoanRecord = (entry) => entry?.loan || entry;

const getLoanField = (loan, snakeKey, camelKey) => loan?.[snakeKey] ?? loan?.[camelKey];

const getStatusLabel = (status) =>
  loanStatusOptions.find((option) => option.value === status)?.label || status || "Unknown";

const UserProfile = ({ currentUser }) => {
  const { userId } = useParams();
  const currentUserId = currentUser?.user?.id;
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [borrowedLoans, setBorrowedLoans] = useState([]);
  const [lentLoans, setLentLoans] = useState([]);
  const [usernameById, setUsernameById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const [userDetails, allItems, users, borrows, lendings] = await Promise.all([
          userService.getUser(userId),
          itemService.getItems(),
          userService.getUsers(),
          loanService.getBorrowedLoans(userId),
          loanService.getLentLoans(userId)
        ]);

        const usernames = buildUsernameMap(Array.isArray(users) ? users : []);
        const ownerItems = (Array.isArray(allItems) ? allItems : []).filter(
          (item) => String(item.owner_id || item.ownerId) === String(userId)
        );

        setUser(userDetails);
        setItems(ownerItems);
        setUsernameById(usernames);
        setBorrowedLoans(Array.isArray(borrows) ? borrows : []);
        setLentLoans(Array.isArray(lendings) ? lendings : []);
      } catch (requestError) {
        setError(requestError.message || "Failed to load profile");
        setUser(null);
        setItems([]);
        setBorrowedLoans([]);
        setLentLoans([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const displayName = user
    ? [user.first_name || user.firstName, user.last_name || user.lastName].filter(Boolean).join(" ")
    : "";

  const renderLoanRow = (entry) => {
    const loan = getLoanRecord(entry);
    const loanId = getLoanField(loan, "id", "id");
    const itemId = getLoanField(loan, "item_id", "itemId");
    const lenderId = String(getLoanField(loan, "lender_id", "lenderId") || "");
    const borrowerId = String(getLoanField(loan, "borrower_id", "borrowerId") || "");
    const status = getLoanField(loan, "status", "status");

    return (
      <article className="list-row" key={loanId}>
        <div>
          <p>
            <span className={`status status-${status === "active" ? "open" : "closed"}`}>
              {getStatusLabel(status)}
            </span>
          </p>
          <span>
            Item:{" "}
            {itemId ? (
              <Link className="owner-link" to={`/items/${itemId}`}>
                View item
              </Link>
            ) : (
              "—"
            )}
          </span>
          <span>
            Lender:{" "}
            <Link className="owner-link" to={`/users/${lenderId}`}>
              {usernameById[lenderId] || "Unknown user"}
            </Link>
            {" · "}
            Borrower:{" "}
            <Link className="owner-link" to={`/users/${borrowerId}`}>
              {usernameById[borrowerId] || "Unknown user"}
            </Link>
          </span>
        </div>
        <div className="button-row">
          <Link className="secondary-button small-button" to={`/loans/${loanId}`}>
            Details
          </Link>
        </div>
      </article>
    );
  };

  return (
    <section className="page-section">
      <div className="page-heading page-heading-row">
        <div>
          <p className="eyebrow">Community</p>
          <h1>{user?.username || "User profile"}</h1>
          {displayName && <p>{displayName}</p>}
        </div>
        <Link className="secondary-button" to="/users">
          Back to users
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="state-panel">Loading profile...</div>}

      {!loading && !error && user && (
        <>
          <div className="profile-hero resource-panel">
            <div className="user-avatar user-avatar-large">{user.username?.slice(0, 1) || "U"}</div>
            <div>
              <h2>@{user.username}</h2>
              {displayName && <p>{displayName}</p>}
              {String(userId) === String(currentUserId) && (
                <Link className="secondary-button small-button" to="/profile">
                  Account settings
                </Link>
              )}
            </div>
          </div>

          <div className="profile-section">
            <div className="panel-heading">
              <h2>Listed items ({items.length})</h2>
            </div>
            {items.length === 0 ? (
              <div className="state-panel">This user has not listed any items yet.</div>
            ) : (
              <div className="item-grid">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    currentUserId={currentUserId}
                    item={item}
                    usernameById={usernameById}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="profile-section">
            <div className="panel-heading">
              <h2>Borrowing ({borrowedLoans.length})</h2>
            </div>
            {borrowedLoans.length === 0 ? (
              <div className="state-panel">No active or past borrows.</div>
            ) : (
              <div className="simple-list">{borrowedLoans.map(renderLoanRow)}</div>
            )}
          </div>

          <div className="profile-section">
            <div className="panel-heading">
              <h2>Lending ({lentLoans.length})</h2>
            </div>
            {lentLoans.length === 0 ? (
              <div className="state-panel">No loans lent out yet.</div>
            ) : (
              <div className="simple-list">{lentLoans.map(renderLoanRow)}</div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default UserProfile;
