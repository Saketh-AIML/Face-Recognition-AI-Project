import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin-login.css";

function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple hardcoded admin check (replace with real API in production)
    if (form.username === "admin" && form.password === "admin123") {
      navigate("/dashboard", { state: { userName: form.username, loginTime: new Date().toISOString() } });
    } else {
      setError("Invalid admin credentials.");
    }
  };

  return (
    <div className="container">
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            required
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
        </div>
        <button type="submit">Login</button>
        {error && <div style={{ color: "#ff6b81", marginTop: "1rem", textAlign: "center" }}>{error}</div>}
      </form>
    </div>
  );
}

export default AdminLogin;