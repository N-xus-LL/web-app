import React from "react";
import { Link } from "react-router-dom";

const Home = ({ currentUser }) => {
  return (
    <section className="page-section hero">
      <div>
        <p className="eyebrow">Community rentals</p>
        <h1>LendLoop</h1>
        <p className="hero-copy">
          Discover items you need from people around you. From tools and bikes to electronics —
          borrow what you need, when you need it, without buying.        </p>

        {currentUser ? (
          <div className="hero-actions">
            <Link className="primary-button" to="/items">
              Manage items
            </Link>
            <Link className="secondary-button" to="/statistics">
              View statistics
            </Link>
          </div>
        ) : (
          <div className="hero-actions">
            <Link className="primary-button" to="/register">
              Create account
            </Link>
            <Link className="secondary-button" to="/login">
              Login
            </Link>
          </div>
        )}

        <div className="stats-strip">
          <div className="stat">
            <strong>Secure and decentralized</strong>
            <span>JWT authentication...add later</span>
          </div>
          <div className="stat">
            <strong>Find what you need</strong>
            <span>Browse available items in your area and request a loan in seconds.</span>
          </div>
          <div className="stat">
            <strong>Lend unused items</strong>
            <span>Turn unused tools, gadgets or equipment into value by sharing them with others.</span>
          </div>
        </div>
      </div>

      <div className="feature-board">
        <article className="feature-card">
          <h2>Item nearby</h2>
          <p>
            Lorem Ipsum is a placeholder text used in the printing and typesetting industry since the 1500s. It is deralorum," and has been popularized in graphic design and web development to demonstrate layout without distracting content. 
          </p>
        </article>
        {currentUser && (
          <article className="profile-card">
            <h2>Current stats</h2>
            <p>Trust policies.</p>
            <div className="profile-line">
              <span>Reputation:</span>
              {/* <strong>{currentUser.user?.username}</strong> */}
            </div>
            <div className="profile-line">
              <span>User ID</span>
              <strong>{currentUser.user?.id}</strong>
            </div>
          </article>
        )}
      </div>
    </section>
  );
};

export default Home;
