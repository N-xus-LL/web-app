import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { itemConditionOptions, loanStatusOptions } from "../constants/referenceData";
import itemService from "../services/itemService";
import loanService from "../services/loanService";
import userService from "../services/userService";
import { buildUsernameMap } from "../utils/userDisplay";

const getLoanField = (loan, snakeKey, camelKey) => loan?.[snakeKey] ?? loan?.[camelKey];

const getStatusLabel = (status) =>
  loanStatusOptions.find((option) => option.value === status)?.label || status || "Unknown";

const LoanDetail = ({ currentUser }) => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const currentUserId = currentUser?.user?.id;
  const [loan, setLoan] = useState(null);
  const [itemName, setItemName] = useState("");
  const [usernameById, setUsernameById] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadLoan = async () => {
    setLoading(true);
    setError("");

    try {
      const [loanData, users] = await Promise.all([
        loanService.getLoan(loanId),
        userService.getUsers()
      ]);

      const record = loanData?.loan || loanData;
      setLoan(record);
      setUsernameById(buildUsernameMap(Array.isArray(users) ? users : []));

      const itemId = getLoanField(record, "item_id", "itemId");
      if (itemId) {
        try {
          const item = await itemService.getItem(itemId);
          setItemName(item.name || "Item");
        } catch {
          setItemName("Item");
        }
      }
    } catch (requestError) {
      setError(requestError.message || "Failed to load loan");
      setLoan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loanId) {
      loadLoan();
    }
  }, [loanId]);

  const lenderId = String(getLoanField(loan, "lender_id", "lenderId") || "");
  const borrowerId = String(getLoanField(loan, "borrower_id", "borrowerId") || "");
  const itemId = getLoanField(loan, "item_id", "itemId");
  const status = getLoanField(loan, "status", "status");
  const canManage =
    currentUserId && (lenderId === String(currentUserId) || borrowerId === String(currentUserId));

  const handleReturn = async () => {
    const conditionOnReturnId = window.prompt(
      "Condition on return",
      itemConditionOptions[0]?.value || "good"
    );
    if (!conditionOnReturnId) {
      return;
    }

    setSaving("return");
    setError("");
    setMessage("");

    try {
      await loanService.returnLoan(loanId, conditionOnReturnId);
      setMessage("Loan marked as returned.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to return loan");
    } finally {
      setSaving("");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this loan?")) {
      return;
    }

    setSaving("cancel");
    setError("");
    setMessage("");

    try {
      await loanService.cancelLoan(loanId);
      setMessage("Loan cancelled.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to cancel loan");
    } finally {
      setSaving("");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this loan permanently?")) {
      return;
    }

    setSaving("delete");
    setError("");

    try {
      await loanService.deleteLoan(loanId);
      navigate("/loans");
    } catch (requestError) {
      setError(requestError.message || "Failed to delete loan");
      setSaving("");
    }
  };

  return (
    <section className="page-section">
      <div className="page-heading page-heading-row">
        <div>
          <p className="eyebrow">Borrowing</p>
          <h1>Loan details</h1>
        </div>
        <Link className="secondary-button" to="/loans">
          Back to loans
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      {loading && <div className="state-panel">Loading loan...</div>}

      {!loading && !error && loan && (
        <div className="resource-panel">
          <div className="item-title-row">
            <h2>{itemName}</h2>
            <span className={`status status-${status === "active" ? "open" : "closed"}`}>
              {getStatusLabel(status)}
            </span>
          </div>

          <dl className="item-detail-facts">
            <div>
              <dt>Item</dt>
              <dd>
                {itemId ? (
                  <Link className="owner-link" to={`/items/${itemId}`}>
                    {itemName}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt>Lender</dt>
              <dd>
                <Link className="owner-link" to={`/users/${lenderId}`}>
                  {usernameById[lenderId] || "Unknown user"}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Borrower</dt>
              <dd>
                <Link className="owner-link" to={`/users/${borrowerId}`}>
                  {usernameById[borrowerId] || "Unknown user"}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Start date</dt>
              <dd>{getLoanField(loan, "start_date", "startDate") || "Not set"}</dd>
            </div>
            <div>
              <dt>Expected return</dt>
              <dd>{getLoanField(loan, "expected_return_date", "expectedReturnDate") || "Not set"}</dd>
            </div>
            <div>
              <dt>Actual return</dt>
              <dd>{getLoanField(loan, "actual_return_date", "actualReturnDate") || "Not returned yet"}</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{getLoanField(loan, "notes", "notes") || "None"}</dd>
            </div>
          </dl>

          {canManage && (
            <div className="button-row">
              <button
                className="secondary-button small-button"
                disabled={Boolean(saving)}
                type="button"
                onClick={handleReturn}
              >
                {saving === "return" ? "Returning..." : "Return item"}
              </button>
              <button
                className="secondary-button small-button"
                disabled={Boolean(saving)}
                type="button"
                onClick={handleCancel}
              >
                {saving === "cancel" ? "Cancelling..." : "Cancel loan"}
              </button>
              <button
                className="danger-button small-button"
                disabled={Boolean(saving)}
                type="button"
                onClick={handleDelete}
              >
                {saving === "delete" ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default LoanDetail;
