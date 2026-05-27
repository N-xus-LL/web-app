import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import itemService from "../services/itemService";
import loanService from "../services/loanService";
import { getItemOwnerId } from "../utils/userDisplay";
import {
  getLoanRecord,
  getLoanStatus,
  LOAN_STATUS
} from "../utils/loanWorkflow";

const countByStatus = (loans, statuses) =>
  loans.filter((entry) => statuses.includes(getLoanStatus(getLoanRecord(entry)))).length;

const Statistics = ({ currentUser }) => {
  const currentUserId = currentUser?.user?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    itemsListed: 0,
    lendings: 0,
    borrowings: 0,
    completed: 0,
    active: 0,
    reputation: "New"
  });

  useEffect(() => {
    const loadStats = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [items, lendings, borrowings] = await Promise.all([
          itemService.getItems(),
          loanService.getLentLoans(currentUserId),
          loanService.getBorrowedLoans(currentUserId)
        ]);

        const myItems = (Array.isArray(items) ? items : []).filter(
          (item) => getItemOwnerId(item) === String(currentUserId)
        );
        const lendingList = Array.isArray(lendings) ? lendings : [];
        const borrowingList = Array.isArray(borrowings) ? borrowings : [];
        const allLoans = [...lendingList, ...borrowingList];

        const completed = countByStatus(allLoans, [LOAN_STATUS.COMPLETED]);
        const active = countByStatus(allLoans, [
          LOAN_STATUS.PENDING,
          LOAN_STATUS.ACTIVE,
          LOAN_STATUS.RETURNED
        ]);

        const finished = countByStatus(allLoans, [
          LOAN_STATUS.COMPLETED,
          LOAN_STATUS.CANCELLED
        ]);
        const successRate = finished > 0 ? Math.round((completed / finished) * 100) : null;

        let reputation = "New";
        if (finished >= 5 && successRate >= 90) {
          reputation = "Excellent";
        } else if (finished >= 3 && successRate >= 75) {
          reputation = "Trusted";
        } else if (finished >= 1) {
          reputation = "Building";
        }

        setStats({
          itemsListed: myItems.length,
          lendings: lendingList.length,
          borrowings: borrowingList.length,
          completed,
          active,
          reputation
        });
      } catch (requestError) {
        setError(requestError.message || "Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [currentUserId]);

  const cards = currentUserId
    ? [
        {
          label: "Items listed",
          value: String(stats.itemsListed),
          description: "Items you own on LendLoop."
        },
        {
          label: "Lendings",
          value: String(stats.lendings),
          description: "Times others borrowed from you."
        },
        {
          label: "Borrowings",
          value: String(stats.borrowings),
          description: "Items you requested or borrowed."
        },
        {
          label: "Completed loans",
          value: String(stats.completed),
          description: "Finished borrows and lendings."
        },
        {
          label: "Active loans",
          value: String(stats.active),
          description: "Pending, borrowed, or awaiting return confirmation."
        },
        {
          label: "Reputation",
          value: stats.reputation,
          description: "Based on your completed loan history."
        }
      ]
    : [];

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">Account insights</p>
        <h1>My statistics</h1>
        <p>
          {currentUser
            ? `Overview for @${currentUser.user?.username}.`
            : "Log in to see your personal stats."}
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!currentUserId && (
        <div className="state-panel">
          <Link className="owner-link" to="/login">
            Log in
          </Link>{" "}
          to view your statistics.
        </div>
      )}

      {currentUserId && loading && <div className="state-panel">Loading statistics...</div>}

      {currentUserId && !loading && (
        <div className="stats-page-grid">
          {cards.map((card) => (
            <article className="stat-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Statistics;
