import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { loanStatusOptions } from "../constants/referenceData";
import itemService from "../services/itemService";
import loanService from "../services/loanService";
import userService from "../services/userService";
import { buildUsernameMap } from "../utils/userDisplay";

const getLoanRecord = (entry) => entry?.loan || entry;

const getLoanField = (loan, snakeKey, camelKey) => loan?.[snakeKey] ?? loan?.[camelKey];

const getStatusLabel = (status) =>
  loanStatusOptions.find((option) => option.value === status)?.label || status || "Unknown";

const emptyCreateForm = {
  item_id: "",
  lender_id: "",
  borrower_id: "",
  notes: ""
};

const Loans = ({ currentUser }) => {
  const [searchParams] = useSearchParams();
  const currentUserId = currentUser?.user?.id;
  const [tab, setTab] = useState("all");
  const [loans, setLoans] = useState([]);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [usernameById, setUsernameById] = useState({});
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadLoans = async (activeTab = tab) => {
    setLoading(true);
    setError("");

    try {
      let response = [];

      if (activeTab === "borrows" && currentUserId) {
        response = await loanService.getBorrowedLoans(currentUserId);
      } else if (activeTab === "lendings" && currentUserId) {
        response = await loanService.getLentLoans(currentUserId);
      } else {
        response = await loanService.getLoans();
      }

      setLoans(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load loans");
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [itemsResponse, usersResponse] = await Promise.all([
          itemService.getItems(),
          userService.getUsers()
        ]);
        const userList = Array.isArray(usersResponse) ? usersResponse : [];
        setItems(Array.isArray(itemsResponse) ? itemsResponse : []);
        setUsers(userList);
        setUsernameById(buildUsernameMap(userList));
      } catch {
        setItems([]);
        setUsers([]);
        setUsernameById({});
      }
    };

    loadReferenceData();
  }, []);

  useEffect(() => {
    const itemId = searchParams.get("item");
    const lenderId = searchParams.get("lender");
    const borrowerId = searchParams.get("borrower");

    if (itemId || lenderId || borrowerId) {
      setCreateForm((current) => ({
        ...current,
        item_id: itemId || current.item_id,
        lender_id: lenderId || current.lender_id,
        borrower_id: borrowerId || current.borrower_id
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    loadLoans(tab);
  }, [tab, currentUserId]);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((current) => ({ ...current, [name]: value }));
  };

  const handleItemChange = (event) => {
    const itemId = event.target.value;
    const selectedItem = items.find((item) => String(item.id) === String(itemId));
    const ownerId = selectedItem ? String(selectedItem.owner_id || selectedItem.ownerId || "") : "";

    setCreateForm((current) => ({
      ...current,
      item_id: itemId,
      lender_id: ownerId
    }));
  };

  const handleCreateLoan = async (event) => {
    event.preventDefault();
    setSaving("create");
    setError("");
    setMessage("");

    try {
      if (!currentUserId) {
        throw new Error("Log in to create a loan.");
      }

      await loanService.createLoan({
        item_id: createForm.item_id,
        lender_id: createForm.lender_id,
        borrower_id: createForm.borrower_id,
        notes: createForm.notes || null
      });

      setCreateForm(emptyCreateForm);
      setMessage("Loan created.");
      await loadLoans(tab);
    } catch (requestError) {
      setError(requestError.message || "Failed to create loan");
    } finally {
      setSaving("");
    }
  };

  const renderLoanRow = (entry) => {
    const loan = getLoanRecord(entry);
    const loanId = getLoanField(loan, "id", "id");
    const itemId = getLoanField(loan, "item_id", "itemId");
    const lenderId = String(getLoanField(loan, "lender_id", "lenderId") || "");
    const borrowerId = String(getLoanField(loan, "borrower_id", "borrowerId") || "");
    const status = getLoanField(loan, "status", "status");
    const item = items.find((entryItem) => String(entryItem.id) === String(itemId));

    return (
      <article className="list-row" key={loanId}>
        <div>
          <p>
            <strong>{item?.name || "Item"}</strong> · {getStatusLabel(status)}
          </p>
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
        <h1>Loans</h1>
        <p>Track borrows, lendings, and loan lifecycle actions.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {currentUserId && (
        <form className="resource-panel form-card" onSubmit={handleCreateLoan}>
          <div className="panel-heading">
            <h2>Create loan</h2>
          </div>
          <div className="form-grid two-columns">
            <div className="field">
              <label htmlFor="item_id">Item</label>
              <select id="item_id" name="item_id" required value={createForm.item_id} onChange={handleItemChange}>
                <option value="">Select item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="lender_id">Lender</label>
              <select id="lender_id" name="lender_id" required value={createForm.lender_id} onChange={handleCreateChange}>
                <option value="">Select lender</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="borrower_id">Borrower</label>
              <select id="borrower_id" name="borrower_id" required value={createForm.borrower_id} onChange={handleCreateChange}>
                <option value="">Select borrower</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="notes">Notes</label>
              <input id="notes" name="notes" value={createForm.notes} onChange={handleCreateChange} />
            </div>
          </div>
          <button className="primary-button" disabled={saving === "create"} type="submit">
            {saving === "create" ? "Creating..." : "Create loan"}
          </button>
        </form>
      )}

      <div className="filter-actions loan-tabs">
        <button
          className={`secondary-button small-button${tab === "all" ? " tab-active" : ""}`}
          type="button"
          onClick={() => setTab("all")}
        >
          All loans
        </button>
        <button
          className={`secondary-button small-button${tab === "borrows" ? " tab-active" : ""}`}
          disabled={!currentUserId}
          type="button"
          onClick={() => setTab("borrows")}
        >
          My borrows
        </button>
        <button
          className={`secondary-button small-button${tab === "lendings" ? " tab-active" : ""}`}
          disabled={!currentUserId}
          type="button"
          onClick={() => setTab("lendings")}
        >
          My lendings
        </button>
      </div>

      {loading && <div className="state-panel">Loading loans...</div>}
      {!loading && loans.length === 0 && <div className="state-panel">No loans found.</div>}
      {!loading && loans.length > 0 && <div className="simple-list">{loans.map(renderLoanRow)}</div>}
    </section>
  );
};

export default Loans;
