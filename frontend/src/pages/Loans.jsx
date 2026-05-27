import React, { useEffect, useState } from "react";
import loanService from "../services/loanService";

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLoans = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await loanService.getLoans();
      setLoans(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const viewLoan = async (loanId) => {
    try {
      await loanService.getLoan(loanId);
      alert(`Viewing loan: ${loanId}`);
    } catch (requestError) {
      alert(requestError.message || "Failed to load loan");
    }
  };

  const returnLoan = async (loanId) => {
    const conditionOnReturnId = window.prompt("Condition on return ID");
    if (!conditionOnReturnId) return;

    try {
      await loanService.returnLoan(loanId, conditionOnReturnId);
      await loadLoans();
    } catch (requestError) {
      alert(requestError.message || "Failed to return loan");
    }
  };

  const cancelLoan = async (loanId) => {
    try {
      await loanService.cancelLoan(loanId);
      await loadLoans();
    } catch (requestError) {
      alert(requestError.message || "Failed to cancel loan");
    }
  };

  const deleteLoan = async (loanId) => {
    if (!window.confirm("Delete this loan?")) return;

    try {
      await loanService.deleteLoan(loanId);
      await loadLoans();
    } catch (requestError) {
      alert(requestError.message || "Failed to delete loan");
    }
  };

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">Borrowing</p>
        <h1>Loans</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="resource-layout">
        <div>
          {loading && <div className="state-panel">Loading loans...</div>}
          {!loading && loans.length === 0 && <div className="state-panel">No loans found.</div>}
          {!loading && loans.length > 0 && (
            <div className="simple-list">
              {loans.map((entry) => {
                const loan = entry.loan || entry;
                return (
                  <article className="list-row" key={loan.id}>
                    <div>
                      <p>{loan.status} · borrower</p>
                      <span>{loan.id}</span>
                    </div>
                    <div className="button-row">
                      <button className="secondary-button small-button" type="button" onClick={() => viewLoan(loan.id)}>
                        View
                      </button>
                      <button className="secondary-button small-button" type="button" onClick={() => returnLoan(loan.id)}>
                        Return
                      </button>
                      <button className="secondary-button small-button" type="button" onClick={() => cancelLoan(loan.id)}>
                        Cancel
                      </button>
                      <button className="danger-button small-button" type="button" onClick={() => deleteLoan(loan.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Loans;