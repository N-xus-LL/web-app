import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import userService from "../services/userService";

const Profile = ({ currentUser, onAuthChange }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "" });
  const [identityForm, setIdentityForm] = useState({ username: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const userId = currentUser?.user?.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    const loadUser = async () => {
      setLoading(true);
      setError("");

      try {
        const details = await userService.getUser(userId);
        setUserDetails(details);
        setProfileForm({
          first_name: details.first_name || details.firstName || "",
          last_name: details.last_name || details.lastName || ""
        });
        setIdentityForm({
          username: details.username || "",
          email: details.email || ""
        });
      } catch (requestError) {
        setError(requestError.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const handleIdentityChange = (event) => {
    const { name, value } = event.target;
    setIdentityForm((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const clearStatus = () => {
    setMessage("");
    setError("");
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    clearStatus();
    setSaving("profile");

    try {
      await userService.updateProfile(userId, profileForm);
      authService.updateStoredUser(profileForm);
      onAuthChange();
      setUserDetails((current) => ({ ...current, ...profileForm }));
      setMessage("Profile names updated.");
    } catch (requestError) {
      setError(requestError.message || "Failed to update profile");
    } finally {
      setSaving("");
    }
  };

  const saveIdentity = async (event) => {
    event.preventDefault();
    clearStatus();
    setSaving("identity");

    try {
      await userService.updateIdentity(userId, identityForm);
      authService.updateStoredUser(identityForm);
      onAuthChange();
      setUserDetails((current) => ({ ...current, ...identityForm }));
      setMessage("Identity details updated.");
    } catch (requestError) {
      setError(requestError.message || "Failed to update identity");
    } finally {
      setSaving("");
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    clearStatus();
    setSaving("password");

    try {
      await userService.updatePassword(userId, passwordForm);
      setPasswordForm({ old_password: "", new_password: "" });
      setMessage("Password updated.");
    } catch (requestError) {
      setError(requestError.message || "Failed to update password");
    } finally {
      setSaving("");
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm("Delete this user account permanently?");

    if (!confirmed) {
      return;
    }

    clearStatus();
    setSaving("delete");

    try {
      await userService.deleteUser(userId);
      authService.logout();
      onAuthChange();
      navigate("/register");
    } catch (requestError) {
      setError(requestError.message || "Failed to delete account");
    } finally {
      setSaving("");
    }
  };

  if (!currentUser) {
    return (
      <section className="page-section">
        <div className="page-heading">
          <p className="eyebrow">Profile</p>
          <h1>Login required</h1>
          <p>Your profile page will show after login.</p>
          <div className="hero-actions">
            <Link className="primary-button" to="/login">
              Login
            </Link>
            <Link className="secondary-button" to="/register">
              Register
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">Profile</p>
        <h1>{identityForm.username || currentUser.user?.username}</h1>
        <p>Edit names, username, email, and password for the logged-in user.</p>
      </div>

      {loading && <div className="state-panel">Loading profile...</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {!loading && (
        <div className="settings-grid">
          <article className="profile-card">
            <h2>Account details</h2>
            <div className="profile-line">
              <span>User ID</span>
              <strong>{userId}</strong>
            </div>
            <div className="profile-line">
              <span>Email</span>
              <strong>{userDetails?.email || identityForm.email || "Not loaded"}</strong>
            </div>
            <div className="profile-line">
              <span>Username</span>
              <strong>{identityForm.username}</strong>
            </div>
          </article>

          <form className="profile-card form-card" onSubmit={saveProfile}>
            <h2>Edit profile</h2>
            <div className="form-grid two-columns">
              <div className="field">
                <label htmlFor="first_name">First name</label>
                <input
                  id="first_name"
                  name="first_name"
                  required
                  type="text"
                  value={profileForm.first_name}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="field">
                <label htmlFor="last_name">Last name</label>
                <input
                  id="last_name"
                  name="last_name"
                  required
                  type="text"
                  value={profileForm.last_name}
                  onChange={handleProfileChange}
                />
              </div>
            </div>
            <button className="primary-button" disabled={saving === "profile"} type="submit">
              {saving === "profile" ? "Saving..." : "Save profile"}
            </button>
          </form>

          <form className="profile-card form-card" onSubmit={saveIdentity}>
            <h2>Edit identity</h2>
            <div className="form-grid two-columns">
              <div className="field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  required
                  type="text"
                  value={identityForm.username}
                  onChange={handleIdentityChange}
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  required
                  type="email"
                  value={identityForm.email}
                  onChange={handleIdentityChange}
                />
              </div>
            </div>
            <button className="primary-button" disabled={saving === "identity"} type="submit">
              {saving === "identity" ? "Saving..." : "Save identity"}
            </button>
          </form>

          <form className="profile-card form-card" onSubmit={savePassword}>
            <h2>Change password</h2>
            <div className="form-grid two-columns">
              <div className="field">
                <label htmlFor="old_password">Old password</label>
                <input
                  autoComplete="current-password"
                  id="old_password"
                  name="old_password"
                  required
                  type="password"
                  value={passwordForm.old_password}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="field">
                <label htmlFor="new_password">New password</label>
                <input
                  autoComplete="new-password"
                  id="new_password"
                  name="new_password"
                  required
                  type="password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                />
              </div>
            </div>
            <button className="primary-button" disabled={saving === "password"} type="submit">
              {saving === "password" ? "Saving..." : "Change password"}
            </button>
          </form>

          <article className="profile-card danger-card">
            <h2>Delete account</h2>
            {/* <p>This calls `DELETE /users/:id` and logs out after a successful delete.</p> */}
            <button className="danger-button" disabled={saving === "delete"} type="button" onClick={deleteAccount}>
              {saving === "delete" ? "Deleting..." : "Delete account"}
            </button>
          </article>
        </div>
      )}
    </section>
  );
};

export default Profile;
