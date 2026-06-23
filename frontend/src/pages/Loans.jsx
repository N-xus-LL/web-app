import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import loanService from "../services/loanService";
import userService from "../services/userService";
import { buildUsernameMap } from "../utils/userDisplay";
import {
  getLoanField,
  getLoanRecord,
  getLoanStatus,
  getStatusLabel
} from "../utils/loanWorkflow";

const Loans = ({ currentUser }) => {
  const currentUserId = currentUser?.user?.id;
  const [tab, setTab] = useState("borrows");
  const [borrows, setBorrows] = useState([]);
  const [lendings, setLendings] = useState([]);
  const [usernameById, setUsernameById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLoans = async () => {
    if (!currentUserId) {
      setBorrows([]);
      setLendings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [borrowsResponse, lendingsResponse, usersResponse] = await Promise.all([
        loanService.getBorrowedLoans(currentUserId),
        loanService.getLentLoans(currentUserId),
        userService.getUsers()
      ]);

      setBorrows(Array.isArray(borrowsResponse) ? borrowsResponse : []);
      setLendings(Array.isArray(lendingsResponse) ? lendingsResponse : []);
      setUsernameById(buildUsernameMap(Array.isArray(usersResponse) ? usersResponse : []));
    } catch (requestError) {
      setError(requestError.message || "Failed to load loans");
      setBorrows([]);
      setLendings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, [currentUserId]);

  const loans = tab === "borrows" ? borrows : lendings;

  const renderLoanRow = (entry) => {
    const loan = getLoanRecord(entry);
    const loanId = getLoanField(loan, "id", "id");
    const itemId = getLoanField(loan, "item_id", "itemId");
    const lenderId = String(getLoanField(loan, "lender_id", "lenderId") || "");
    const borrowerId = String(getLoanField(loan, "borrower_id", "borrowerId") || "");
    const status = getLoanStatus(loan);
    const counterpartyId = tab === "borrows" ? lenderId : borrowerId;
    const counterpartyLabel = tab === "borrows" ? "Lender" : "Borrower";

    return (
      <article className="list-row" key={loanId}>
        <div>
          <p>
            <span className={`status status-${status === "active" ? "open" : "closed"}`}>
              {getStatusLabel(status)}
            </span>
          </p>
          <span>
            {counterpartyLabel}:{" "}
            <Link className="owner-link" to={`/users/${counterpartyId}`}>
              {usernameById[counterpartyId] || "Unknown user"}
            </Link>
          </span>
        </div>
        <div className="button-row">
          <Link className="secondary-button small-button" to={`/loans/${loanId}`}>
            Manage
          </Link>
          {itemId && (
            <Link className="secondary-button small-button" to={`/items/${itemId}`}>
              Item
            </Link>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">Borrowing</p>
        <h1>My loans</h1>
        <p>Request items from their page. Owners approve, borrowers return, owners confirm.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!currentUserId && (
        <div className="state-panel">
          <Link className="owner-link" to="/login">
            Log in
          </Link>{" "}
          to see your borrows and lendings.
        </div>
      )}

      {currentUserId && (
        <>
          <div className="filter-actions loan-tabs">
            <button
              className={`secondary-button small-button${tab === "borrows" ? " tab-active" : ""}`}
              type="button"
              onClick={() => setTab("borrows")}
            >
              My borrows ({borrows.length})
            </button>
            <button
              className={`secondary-button small-button${tab === "lendings" ? " tab-active" : ""}`}
              type="button"
              onClick={() => setTab("lendings")}
            >
              My lendings ({lendings.length})
            </button>
          </div>

          {loading && <div className="state-panel">Loading loans...</div>}
          {!loading && loans.length === 0 && (
            <div className="state-panel">
              {tab === "borrows"
                ? "You have no borrow requests yet. Browse items and request a loan."
                : "No one has requested your items yet."}
            </div>
          )}
          {!loading && loans.length > 0 && <div className="simple-list">{loans.map(renderLoanRow)}</div>}
        </>
      )}
    </section>
  );
};

export default Loans;
