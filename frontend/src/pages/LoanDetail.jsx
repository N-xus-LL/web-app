import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoanWorkflowSteps from "../components/LoanWorkflowSteps";
import { itemConditionOptions } from "../constants/referenceData";
import itemService from "../services/itemService";
import loanService from "../services/loanService";
import userService from "../services/userService";
import { buildUsernameMap } from "../utils/userDisplay";
import {
  getLoanField,
  getLoanRecord,
  getLoanStatus,
  getStatusLabel,
  LOAN_STATUS,
  updateItemAfterReturn
} from "../utils/loanWorkflow";

const LoanDetail = ({ currentUser }) => {
  const { loanId } = useParams();
  const currentUserId = currentUser?.user?.id;
  const [loan, setLoan] = useState(null);
  const [itemName, setItemName] = useState("");
  const [usernameById, setUsernameById] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [returnCondition, setReturnCondition] = useState("");

  const loadLoan = async () => {
    setLoading(true);
    setError("");

    try {
      const [loanData, users] = await Promise.all([
        loanService.getLoan(loanId),
        userService.getUsers()
      ]);

      const record = getLoanRecord(loanData);
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
  const status = getLoanStatus(loan);
  const isLender = Boolean(currentUserId) && lenderId === String(currentUserId);
  const isBorrower = Boolean(currentUserId) && borrowerId === String(currentUserId);
  const canView = isLender || isBorrower;

  const handleApprove = async () => {
    setSaving("approve");
    setError("");
    setMessage("");

    try {
      await loanService.updateLoan(loanId, { status: LOAN_STATUS.ACTIVE });
      if (itemId) {
        await setItemAvailability(itemId, false);
      }
      setMessage("Borrow approved. Item is now on loan.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to approve borrow");
    } finally {
      setSaving("");
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Reject this borrow request?")) {
      return;
    }

    setSaving("reject");
    setError("");
    setMessage("");

    try {
      await loanService.cancelLoan(loanId);
      setMessage("Borrow request rejected.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to reject request");
    } finally {
      setSaving("");
    }
  };

  const handleMarkReturned = async () => {
    setSaving("return");
    setError("");
    setMessage("");

    try {
      await loanService.updateLoan(loanId, { status: LOAN_STATUS.RETURNED });
      setMessage("Return submitted. Waiting for owner to confirm.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to submit return");
    } finally {
      setSaving("");
    }
  };

  const handleConfirmReturn = async (event) => {
    event.preventDefault();

    if (!returnCondition) {
      setError("Select the item condition on return.");
      return;
    }

    setSaving("confirm");
    setError("");
    setMessage("");

    try {
      await loanService.returnLoan(loanId, returnCondition);
      if (itemId) {
        await updateItemAfterReturn(itemId, returnCondition);
      }
      setMessage("Return confirmed. Item condition updated and listed as available.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to confirm return");
    } finally {
      setSaving("");
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm("Cancel your borrow request?")) {
      return;
    }

    setSaving("cancel");
    setError("");
    setMessage("");

    try {
      await loanService.cancelLoan(loanId);
      setMessage("Borrow request cancelled.");
      await loadLoan();
    } catch (requestError) {
      setError(requestError.message || "Failed to cancel request");
    } finally {
      setSaving("");
    }
  };

  if (!loading && loan && currentUserId && !canView) {
    return (
      <section className="page-section">
        <div className="alert alert-error">You can only view loans you are part of.</div>
        <Link className="secondary-button" to="/loans">
          Back to my loans
        </Link>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-heading page-heading-row">
        <div>
          <p className="eyebrow">Borrowing</p>
          <h1>Loan details</h1>
        </div>
        <Link className="secondary-button" to="/loans">
          Back to my loans
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      {loading && <div className="state-panel">Loading loan...</div>}

      {!loading && !error && loan && canView && (
        <div className="resource-panel">
          <div className="item-title-row">
            <h2>{itemName}</h2>
            <span className={`status status-${status === LOAN_STATUS.ACTIVE ? "open" : "closed"}`}>
              {getStatusLabel(status)}
            </span>
          </div>

          <LoanWorkflowSteps status={status} />

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
              <dt>Notes</dt>
              <dd>{getLoanField(loan, "notes", "notes") || "None"}</dd>
            </div>
          </dl>

          <div className="button-row">
            {isLender && status === LOAN_STATUS.PENDING && (
              <>
                <button
                  className="primary-button small-button"
                  disabled={Boolean(saving)}
                  type="button"
                  onClick={handleApprove}
                >
                  {saving === "approve" ? "Approving..." : "Approve borrow"}
                </button>
                <button
                  className="danger-button small-button"
                  disabled={Boolean(saving)}
                  type="button"
                  onClick={handleReject}
                >
                  {saving === "reject" ? "Rejecting..." : "Reject"}
                </button>
              </>
            )}

            {isBorrower && status === LOAN_STATUS.PENDING && (
              <button
                className="secondary-button small-button"
                disabled={Boolean(saving)}
                type="button"
                onClick={handleCancelRequest}
              >
                {saving === "cancel" ? "Cancelling..." : "Cancel request"}
              </button>
            )}

            {isBorrower && status === LOAN_STATUS.ACTIVE && (
              <button
                className="primary-button small-button"
                disabled={Boolean(saving)}
                type="button"
                onClick={handleMarkReturned}
              >
                {saving === "return" ? "Submitting..." : "Mark as returned"}
              </button>
            )}

          </div>

          {isLender && status === LOAN_STATUS.RETURNED && (
            <form className="resource-panel form-card return-confirm-panel" onSubmit={handleConfirmReturn}>
              <div className="panel-heading">
                <h2>Confirm return</h2>
              </div>
              <p className="return-confirm-copy">
                Check the item and record its condition before marking it available again.
              </p>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="condition_on_return">Condition on return</label>
                  <select
                    id="condition_on_return"
                    name="condition_on_return"
                    required
                    value={returnCondition}
                    onChange={(event) => setReturnCondition(event.target.value)}
                  >
                    <option value="">Select condition</option>
                    {itemConditionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="primary-button" disabled={Boolean(saving)} type="submit">
                {saving === "confirm" ? "Confirming..." : "Confirm return"}
              </button>
            </form>
          )}
        </div>
      )}

      {!currentUserId && !loading && (
        <div className="state-panel">
          <Link className="owner-link" to="/login">
            Log in
          </Link>{" "}
          to manage this loan.
        </div>
      )}
    </section>
  );
};

export default LoanDetail;
