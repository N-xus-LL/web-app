import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";

const Login = ({ onAuthChange }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await authService.login({ identifier, password });
      onAuthChange();
      navigate("/");
    } catch (error) {
      setMessage(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <p className="eyebrow">Welcome back</p>
        <h1>Log in and keep the loop moving. </h1>
        <p>
          Use either your email or username.
          {/* After login, the JWT from Ktor is saved locally and reused by the API service for authenticated requests. */}
        </p>
      </div>

      <form className="auth-card" onSubmit={handleLogin}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="identifier">Email or username</label>
            <input
              autoComplete="username"
              id="identifier"
              placeholder="test12@lendloop.test"
              required
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              autoComplete="current-password"
              id="password"
              placeholder="test1"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </div>

        <div className="form-footer">
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Logging in..." : "Login"}
          </button>
          {message && <div className="alert alert-error">{message}</div>}
          <p className="muted-link">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </form>
    </section>
  );
};

export default Login;
