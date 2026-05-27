import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import OwnerLink from "../components/OwnerLink";
import {
  categoryOptions,
  damagePolicyOptions,
  itemConditionOptions
} from "../constants/referenceData";
import itemService from "../services/itemService";
import loanService from "../services/loanService";
import userService from "../services/userService";
import { buildUsernameMap, getItemOwnerId } from "../utils/userDisplay";
import {
  findActiveLoanForItem,
  getLoanField,
  getLoanRecord,
  getLoanStatus,
  getStatusLabel
} from "../utils/loanWorkflow";

const getItemLocation = (item) => item.current_location || item.currentLocation || {};

const getOptionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || value || "Not set";

const ItemDetail = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserId = currentUser?.user?.id;
  const [item, setItem] = useState(null);
  const [itemLoan, setItemLoan] = useState(null);
  const [usernameById, setUsernameById] = useState({});
  const [requestNotes, setRequestNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadItemContext = async () => {
    if (!item?.id) {
      return;
    }

    const ownerId = getItemOwnerId(item);

    try {
      const lendings = await loanService.getLentLoans(ownerId);
      const active = findActiveLoanForItem(Array.isArray(lendings) ? lendings : [], item.id);
      setItemLoan(active ? getLoanRecord(active) : null);
    } catch {
      setItemLoan(null);
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

  useEffect(() => {
    const loadItem = async () => {
      setLoading(true);
      setError("");
      setMessage("");

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

  useEffect(() => {
    if (item?.id) {
      loadItemContext();
    }
  }, [item?.id, item?.available]);

  const ownerId = item ? getItemOwnerId(item) : "";
  const ownerUsername = ownerId ? usernameById[ownerId] || "Unknown user" : "Unknown user";
  const isOwner = Boolean(currentUserId) && ownerId === String(currentUserId);
  const location = item ? getItemLocation(item) : {};
  const imageUrl = item?.images?.[0];
  const loanStatus = itemLoan ? getLoanStatus(itemLoan) : null;
  const loanId = itemLoan ? getLoanField(itemLoan, "id", "id") : null;
  const loanBorrowerId = itemLoan ? String(getLoanField(itemLoan, "borrower_id", "borrowerId") || "") : "";
  const isBorrowerOnLoan = Boolean(currentUserId) && loanBorrowerId === String(currentUserId);
  const hasBlockingLoan = Boolean(itemLoan);
  const canRequest =
    currentUserId &&
    !isOwner &&
    item?.available &&
    !hasBlockingLoan;

  const handleBorrowRequest = async () => {
    setRequesting(true);
    setError("");
    setMessage("");

    try {
      if (!currentUserId) {
        throw new Error("Log in to request a borrow.");
      }

      const created = await loanService.createLoan({
        item_id: item.id,
        lender_id: ownerId,
        borrower_id: currentUserId,
        notes: requestNotes.trim() || null
      });

      const loan = getLoanRecord(created);
      setMessage("Borrow request sent. Waiting for owner approval.");
      setRequestNotes("");
      navigate(`/loans/${getLoanField(loan, "id", "id")}`);
    } catch (requestError) {
      setError(requestError.message || "Failed to send borrow request");
    } finally {
      setRequesting(false);
    }
  };

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
      {message && <div className="alert alert-success">{message}</div>}
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
                <dd>
                  <OwnerLink ownerId={ownerId} username={ownerUsername} />
                </dd>
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
              {loanStatus && (
                <div>
                  <dt>Loan status</dt>
                  <dd>{getStatusLabel(loanStatus)}</dd>
                </div>
              )}
            </dl>

            {isOwner && (
              <div className="button-row">
                <Link className="primary-button" to={`/items/${item.id}/edit`}>
                  Edit item
                </Link>
                {loanId && (
                  <Link className="secondary-button" to={`/loans/${loanId}`}>
                    View loan request
                  </Link>
                )}
              </div>
            )}

            {canRequest && (
              <div className="resource-panel borrow-request-panel">
                <h3>Request to borrow</h3>
                <p>Your request goes to the owner for approval before the item is borrowed.</p>
                <div className="field">
                  <label htmlFor="request_notes">Message (optional)</label>
                  <input
                    id="request_notes"
                    placeholder="When do you need it?"
                    value={requestNotes}
                    onChange={(event) => setRequestNotes(event.target.value)}
                  />
                </div>
                <button
                  className="primary-button"
                  disabled={requesting}
                  type="button"
                  onClick={handleBorrowRequest}
                >
                  {requesting ? "Sending request..." : "Send borrow request"}
                </button>
              </div>
            )}

            {!currentUserId && !isOwner && item.available && !hasBlockingLoan && (
              <div className="state-panel">
                <Link className="owner-link" to="/login">
                  Log in
                </Link>{" "}
                to request this item.
              </div>
            )}

            {isBorrowerOnLoan && loanId && (
              <div className="button-row">
                <Link className="primary-button" to={`/loans/${loanId}`}>
                  View your borrow
                </Link>
              </div>
            )}

            {hasBlockingLoan && !isOwner && !isBorrowerOnLoan && (
              <div className="state-panel">This item already has an active borrow request.</div>
            )}
          </div>
        </article>
      )}
    </section>
  );
};

export default ItemDetail;
