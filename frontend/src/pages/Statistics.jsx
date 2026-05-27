import React from "react";

const Statistics = ({ currentUser }) => {
  const cards = [
    { label: "Transaction History", value: "0", description: "Completed, cancelled, and active transactions will show here." },
    { label: "Reputation", value: "New", description: "Ratings and trust score can be calculated from loan outcomes." },
    { label: "Number of lendings", value: "0", description: "Items this user has lent to others." },
    { label: "Number of borrowings", value: "0", description: "Items this user has borrowed from others." }
  ];

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">Account insights</p>
        <h1>Statistics</h1>
        <p>
          {currentUser ? `Stats shell for ${currentUser.user?.username}.` : "Log in to connect these stats to your account."}
        </p>
      </div>

      <div className="stats-page-grid">
        {cards.map((card) => (
          <article className="stat-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Statistics;
