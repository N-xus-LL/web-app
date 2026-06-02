import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await authService.register(formData);
      setMessage("Registration successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 650);
    } catch (requestError) {
      setError(requestError.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <p className="eyebrow">Create account</p>
        <h1>Start lending and borrowing with people nearby.</h1>
        <p>
          This form posts to the Ktor `/users/register` route using snake_case fields, matching the backend JSON configuration.
        </p>
      </div>

      <form className="auth-card" onSubmit={handleRegister}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              autoComplete="username"
              id="username"
              name="username"
              placeholder="test12"
              required
              type="text"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              autoComplete="email"
              id="email"
              name="email"
              placeholder="test12@lendloop.test"
              required
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              autoComplete="new-password"
              id="password"
              name="password"
              placeholder="test1"
              required
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="form-grid two-columns">
            <div className="field">
              <label htmlFor="first_name">First name</label>
              <input
                autoComplete="given-name"
                id="first_name"
                name="first_name"
                placeholder="tes2323t"
                required
                type="text"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="last_name">Last name</label>
              <input
                autoComplete="family-name"
                id="last_name"
                name="last_name"
                placeholder="1"
                required
                type="text"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Creating account..." : "Register"}
          </button>
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          <p className="muted-link">
            Already registered? <Link to="/login">Login</Link>
          </p>
        </div>
      </form>
    </section>
  );
};

export default Register;
