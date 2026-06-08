import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import authService from "../services/authService";

const ThemeToggleIcon = ({ theme }) => {
  if (theme === "dark") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M12 2.75v2.1M12 19.15v2.1M4.22 4.22l1.48 1.48M18.3 18.3l1.48 1.48M2.75 12h2.1M19.15 12h2.1M4.22 19.78l1.48-1.48M18.3 5.7l1.48-1.48"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.75"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20.2 14.4a7.6 7.6 0 0 1-10.6-10.6 7.6 7.6 0 1 0 10.6 10.6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
};

const Header = ({ currentUser, onAuthChange, theme, onThemeToggle }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    onAuthChange();
    setMenuOpen(false);
    navigate("/login");
  };

  const closeMenu = () => {
    setMenuOpen(false);
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <header className="site-header">
      <nav className="nav">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <img alt="LendLoop logo" src="/src/images/ll_no_bg.png" />
          </span>
          <span>LendLoop</span>
        </Link>

        <div className="nav-links">
          <button
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme === "dark"}
            className="theme-toggle"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            type="button"
            onClick={onThemeToggle}
          >
            <ThemeToggleIcon theme={theme} />
          </button>
          <NavLink className="nav-link" to="/" onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink className="nav-link" to="/map" onClick={closeMenu}>
            Map
          </NavLink>
          <NavLink className="nav-link" to="/items" onClick={closeMenu}>
            Items
          </NavLink>
          {/* <NavLink className="nav-link" to="/locations" onClick={closeMenu}>
            Locations
          </NavLink> */}
          <NavLink className="nav-link" to="/loans" onClick={closeMenu}>
            Loans
          </NavLink>
          <NavLink className="nav-link" to="/users" end onClick={closeMenu}>
            Users
          </NavLink>





          <div className="dropdown">
            <button
              aria-expanded={menuOpen}
              className="dropdown-button"
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
            >
              Menu
              {/* <span aria-hidden="true">v</span> */}
            </button>

            {menuOpen && (
              <div className="dropdown-menu">
                {currentUser ? (
                  <>
                    <NavLink className="dropdown-item" to="/profile" onClick={closeMenu}>
                      Profile
                    </NavLink>
                    <NavLink className="dropdown-item" to="/statistics" onClick={closeMenu}>
                      Statistics
                    </NavLink>
                    <NavLink className="dropdown-item" to="/users/items" onClick={closeMenu}>
                      My Items
                    </NavLink>
                    <button className="dropdown-item" type="button" onClick={handleLogout}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink className="dropdown-item" to="/login" onClick={closeMenu}>
                      Login
                    </NavLink>
                    <NavLink className="dropdown-item" to="/register" onClick={closeMenu}>
                      Register
                    </NavLink>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
