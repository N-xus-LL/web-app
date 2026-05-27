import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import authService from "../services/authService";

const Header = ({ currentUser, onAuthChange }) => {
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
          <NavLink className="nav-link" to="/" onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink className="nav-link" to="/map" onClick={closeMenu}>
            Map
          </NavLink>
          <NavLink className="nav-link" to="/items" onClick={closeMenu}>
            Items
          </NavLink>
          <NavLink className="nav-link" to="/users" onClick={closeMenu}>
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
