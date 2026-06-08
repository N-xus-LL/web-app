import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import itemService from "../services/itemService";
import loanService from "../services/loanService";
import { getItemOwnerId } from "../utils/userDisplay";
import {
  getLoanRecord,
  getLoanStatus
} from "../utils/loanWorkflow";
import { PieChart, DonutChart, BarChart, ChartLegend } from "../components/Charts"

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
        var itemCondList = [0, 0, 0, 0, 0];
        for (var i = 0; i < myItems.length; i++) {
            switch (myItems[i].condition_id) {
              case "excellent":
                itemCondList[0]++;
                break;
              case "good":
                itemCondList[1]++;
                break;
              case "fair":
                 itemCondList[2]++;
                break;
              case "poor":
                itemCondList[3]++;
                break;
              case "damaged":
                itemCondList[4]++;
                break;
            }
        }
        setItemConditions([
          { label: "Excellent", value: itemCondList[0], color: "#53F244" },
          { label: "Good", value: itemCondList[1], color: "#44A7F2" },
          { label: "Fair", value: itemCondList[2], color: "#9A5EE0" },
          { label: "Poor", value: itemCondList[3], color: "#ECF244" },
          { label: "Damaged", value: itemCondList[4], color: "#F52A2A" }
        ]);

        const lendingList = Array.isArray(lendings) ? lendings : [];
        const borrowingList = Array.isArray(borrowings) ? borrowings : [];
        const allLoans = [...lendingList, ...borrowingList];

        var loanLendingStatuses = [0, 0, 0, 0, 0];
        for (var i = 0; i < lendingList.length; i++) {
            switch (lendingList[i].status) {
              case "pending":
                loanLendingStatuses[0]++;
                break;
              case "active":
                loanLendingStatuses[1]++;
                break;
              case "returned":
                 loanLendingStatuses[2]++;
                break;
              case "completed":
                loanLendingStatuses[3]++;
                break;
              case "cancelled":
                loanLendingStatuses[4]++;
                break;
            }
        }
        setLendingData([
          { label: "Awaiting approval", value: loanLendingStatuses[0], color: "#9A5EE0" },
          { label: "Borrowed", value: loanLendingStatuses[1], color: "#44A7F2" },
          { label: "Return pending", value: loanLendingStatuses[2], color: "#ECF244" },
          { label: "Completed", value: loanLendingStatuses[3], color: "#53F244" },
          { label: "Cancelled", value: loanLendingStatuses[4], color: "#F52A2A" }
        ]);

        var loanBorrowingStatuses = [0, 0, 0, 0, 0];
        for (var i = 0; i < borrowingList.length; i++) {
            switch (borrowingList[i].status) {
                case "pending":
                    loanBorrowingStatuses[0]++;
                    break;
                case "active":
                    loanBorrowingStatuses[1]++;
                    break;
                case "returned":
                    loanBorrowingStatuses[2]++;
                    break;
                case "completed":
                    loanBorrowingStatuses[3]++;
                    break;
                case "cancelled":
                    loanBorrowingStatuses[4]++;
                    break;
            }
        }
        setBorrowingData([
          { label: "Awaiting approval", value: loanBorrowingStatuses[0], color: "#9A5EE0" },
          { label: "Borrowed", value: loanBorrowingStatuses[1], color: "#44A7F2" },
          { label: "Return pending", value: loanBorrowingStatuses[2], color: "#ECF244" },
          { label: "Completed", value: loanBorrowingStatuses[3], color: "#53F244" },
          { label: "Cancelled", value: loanBorrowingStatuses[4], color: "#F52A2A" }
        ]);

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
            { label: "Completed", value: finished, color: "#53F244" }
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
