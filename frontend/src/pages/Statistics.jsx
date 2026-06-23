import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import itemService from "../services/itemService";
import loanService from "../services/loanService";
import { getItemOwnerId } from "../utils/userDisplay";
import {
  getLoanRecord,
  getLoanStatus
} from "../utils/loanWorkflow";
import { LoanStatus, itemConditionOptions, loanStatusOptions } from "../constants/referenceData";
import { PieChart, DonutChart, BarChart, ChartLegend } from "../components/Charts"

const countByStatus = (loans, statuses) =>
  loans.filter((entry) => statuses.includes(getLoanStatus(getLoanRecord(entry)))).length;

const statusColors = {
  borrowing_requested: "#9A5EE0",
  awaiting_pickup: "#44A7F2",
  active: "#2563eb",
  returned: "#ECF244",
  completed: "#53F244",
  cancelled: "#F52A2A"
};

const conditionColors = {
  excellent: "#53F244",
  very_good: "#22c55e",
  good: "#44A7F2",
  fair: "#9A5EE0",
  poor: "#ECF244",
  damaged: "#F52A2A",
  broken: "#F52A2A"
};

const buildStatusChartData = (loans) =>
  loanStatusOptions.map((status) => ({
    label: status.label,
    value: countByStatus(loans, [status.value]),
    color: statusColors[status.value] || "#94a3b8"
  }));

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
  const [lendingData, setLendingData] = useState([]);
  const [borrowingData, setBorrowingData] = useState([]);
  const [loanCompletionStatuses, setLoanCompletionStatuses] = useState([]);
  const [itemConditions, setItemConditions] = useState([]);


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
        setItemConditions(
          itemConditionOptions.map((condition) => ({
            label: condition.label,
            value: myItems.filter((item) => {
              const itemCondition = item.condition_id || item.conditionId;
              return itemCondition === condition.value || (condition.value === "broken" && itemCondition === "damaged");
            }).length,
            color: conditionColors[condition.value] || "#94a3b8"
          }))
        );

        const lendingList = Array.isArray(lendings) ? lendings : [];
        const borrowingList = Array.isArray(borrowings) ? borrowings : [];
        const allLoans = [...lendingList, ...borrowingList];

        setLendingData(buildStatusChartData(lendingList));
        setBorrowingData(buildStatusChartData(borrowingList));

        const completed = countByStatus(allLoans, [LoanStatus.Completed.value]);
        const active = countByStatus(allLoans, [
          LoanStatus.BorrowingRequested.value,
          LoanStatus.Active.value,
          LoanStatus.Returned.value
        ]);

        const finished = countByStatus(allLoans, [
          LoanStatus.Completed.value,
          LoanStatus.Cancelled.value
        ]);
        setLoanCompletionStatuses([
            { label: "Active", value: active, color: "#44A7F2" },
            { label: "Finished", value: finished, color: "#53F244" }
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
      <div>
        <div className="stats-page-grid">
          {cards.map((card) => (
            <article className="stat-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.description}</p>
            </article>
          ))}
        </div>

        <div className="charts">
          <div className="chart-card">
            <div className="chart-title">Item Conditions</div>
                <BarChart data={itemConditions} />
          </div>
          <div className="chart-card">
            <div className="chart-title">Lending</div>
                <DonutChart data={lendingData} />
                <ChartLegend data={lendingData} />
          </div>
          <div className="chart-card">
            <div className="chart-title">Borrowing</div>
                <DonutChart data={borrowingData} />
                <ChartLegend data={borrowingData} />
          </div>
          <div className="chart-card">
            <div className="chart-title">All Loans</div>
                <PieChart data={loanCompletionStatuses} />
                <ChartLegend data={loanCompletionStatuses} />
          </div>

        </div>

      </div>
      )}
    </section>
  );
};

export default Statistics;
