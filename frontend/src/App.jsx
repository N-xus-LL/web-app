import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ItemDetail from "./pages/ItemDetail";
import ItemForm from "./pages/ItemForm";
import Home from "./pages/Home";
import ItemManagement from "./pages/ItemManagement";
import LoanDetail from "./pages/LoanDetail";
import Loans from "./pages/Loans";
import Locations from "./pages/Locations";
import Login from "./pages/Login";
import MapPage from "./pages/MapPage";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Statistics from "./pages/Statistics";
import UserProfile from "./pages/UserProfile";
import Users from "./pages/Users";
import UserItems from "./pages/UserItems";
import authService from "./services/authService";
import themeService from "./services/themeService";
import "./index.css";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState(() => themeService.getStoredTheme());

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    themeService.applyTheme(theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((current) => themeService.toggleTheme(current));
  };

  const handleAuthChange = () => {
    setCurrentUser(authService.getCurrentUser());
  };

  return (
    <Router>
      <div className="app-shell">
        <Header
          currentUser={currentUser}
          onAuthChange={handleAuthChange}
          onThemeToggle={handleThemeToggle}
          theme={theme}
        />
        <main className="content">
          <Routes>
            <Route path="/" element={<Home currentUser={currentUser} />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/statistics" element={<Statistics currentUser={currentUser} />} />
            <Route path="/items" element={<ItemManagement currentUser={currentUser} />} />
            <Route path="/items/new" element={<ItemForm currentUser={currentUser} />} />
            <Route path="/items/:id/edit" element={<ItemForm currentUser={currentUser} />} />
            <Route path="/items/:id" element={<ItemDetail currentUser={currentUser} />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/loans" element={<Loans currentUser={currentUser} />} />
            <Route path="/loans/:loanId" element={<LoanDetail currentUser={currentUser} />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/items" element={<UserItems currentUser={currentUser} />} />
            <Route path="/users/:userId" element={<UserProfile currentUser={currentUser} />} />
            <Route
              path="/profile"
              element={<Profile currentUser={currentUser} onAuthChange={handleAuthChange} />}
            />
            <Route path="/login" element={<Login onAuthChange={handleAuthChange} />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
