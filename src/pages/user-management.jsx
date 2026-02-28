import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./user-management.css";

const normalizeUser = (item, key) => ({
  id: item.id || item._id || null,
  name: item.name || item.userName || item.username || item.fullName || "",
  email: item.email || item.mail || "",
  role: item.role || item.userRole || "user",
  loginTime: item.loginTime || item.loginTimestamp || item.lastLogin || null,
  image: item.image || item.avatar || null,
  _rawKey: key || ""
});

const loadAllUsersFromLocalStorage = () => {
  try {
    const result = [];

    // Prefer a single "users" array key
    const stored = localStorage.getItem("users");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.map((p) => normalizeUser(p, "users"));
        if (parsed && typeof parsed === "object") return Object.values(parsed).map((p) => normalizeUser(p, "users"));
      } catch (e) {
        // ignore
      }
    }

    // Otherwise scan keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const lower = key.toLowerCase();
      if (!(lower === "user" || lower.startsWith("user"))) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") result.push(normalizeUser(parsed, key));
      } catch (e) {
        // ignore non-json
      }
    }

    // dedupe
    const seen = new Set();
    const dedup = [];
    for (const u of result) {
      const id = `${u.name}|${u.email}|${u.loginTime}`;
      if (!seen.has(id)) {
        seen.add(id);
        dedup.push(u);
      }
    }

    return dedup;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Vite exposes env variables via import.meta.env and requires VITE_ prefix for client use
  const API_USERS = import.meta.env.VITE_API_USERS || "/api/users";

  const fetchUsersFromServer = async () => {
    setLoading(true);
    setError(null);
    try {
      // Configurable via Vite envs
      const AUTH_HEADER = import.meta.env.VITE_API_AUTH_HEADER || "Authorization";
      const AUTH_KEY = import.meta.env.VITE_API_AUTH_KEY || null;
      const USE_CREDENTIALS = (import.meta.env.VITE_API_USE_CREDENTIALS || "false") === "true";

      // Build headers (token from localStorage or static key)
      const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken");
      const headers = { "Content-Type": "application/json" };
      if (AUTH_KEY) {
        headers[AUTH_HEADER] = AUTH_KEY;
      } else if (token) {
        headers[AUTH_HEADER] = AUTH_HEADER.toLowerCase() === "authorization" ? `Bearer ${token}` : token;
      }

      const fetchOpts = { headers };
      if (USE_CREDENTIALS) fetchOpts.credentials = "include";

      const res = await fetch(API_USERS, fetchOpts);
      if (res.status === 401 || res.status === 403) {
        // unauthorized - redirect to admin-login
        navigate("/admin-login");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Status ${res.status}`);
      }

      // Ensure JSON
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      let data;
      if (!contentType.includes("application/json")) {
        const text = await res.text().catch(() => "");
        throw new Error(text ? text : `Expected JSON but got ${contentType || 'unknown'}`);
      } else {
        data = await res.json();
      }

      // Accept multiple shapes: top-level array, or wrapper objects like { users: [...] }, { data: [...] }
      let usersArray = [];
      if (Array.isArray(data)) usersArray = data;
      else if (data && typeof data === 'object') {
        const candidates = ["users", "data", "results", "rows", "items"];
        for (const c of candidates) {
          if (Array.isArray(data[c])) { usersArray = data[c]; break; }
        }
        if (!usersArray.length) {
          for (const k of Object.keys(data)) {
            if (Array.isArray(data[k])) { usersArray = data[k]; break; }
          }
        }
      }

      const list = Array.isArray(usersArray) ? usersArray.map(u => ({
        id: u.id || u._id || null,
        name: u.name || u.userName || u.username || u.fullName || "",
        email: u.email || u.mail || u.contact || "",
        role: u.role || u.userRole || (u.isAdmin ? "admin" : "user") || "user",
        loginTime: u.loginTime || u.lastLogin || u.loginTimestamp || u.last_seen || u.lastLogin || null,
        image: u.image || u.avatar || u.photo || null,
        _rawKey: u.id || u._id || u.email || "server"
      })) : [];

      setUsers(list);
    } catch (err) {
      console.error("Failed to fetch users from server:", err);
      const message = err && err.message ? err.message : "Failed to load users from server";
      setError(message);

      // fallback to local cache
      try {
        const local = loadAllUsersFromLocalStorage();
        if (Array.isArray(local) && local.length > 0) {
          setUsers(local);
          setError(prev => (prev ? prev + " — loaded local cache (click Refresh to retry server)" : "Loaded local cache"));
        }
      } catch (e) {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // try server first, then page UI allows fallback
    fetchUsersFromServer();
  }, []);

  return (
    <div className="user-management">
      <div className="um-header">
        <h2>User Management</h2>
        <div className="um-actions">
          <button onClick={() => fetchUsersFromServer()}>Refresh (server)</button>
          <button onClick={() => setUsers(loadAllUsersFromLocalStorage())}>Load local cache</button>
          <button onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      {loading ? (
        <p className="um-loading">Loading users...</p>
      ) : null}

      {/* Compact notices: don't display raw server HTML or long error text */}
      {error && users.length > 0 && (
        <div className="um-note">
          <em>Showing local cache (server unavailable). Click "Refresh (server)" to retry.</em>
        </div>
      )}

      {error && users.length === 0 && (
        <div className="um-error">
          <strong>Unable to load users from server.</strong>
          <div className="um-error-sub">Try clicking "Load local cache" or check your backend.</div>
        </div>
      )}

      <p className="um-count">Total users: {users.length}</p>

      {users.length === 0 ? (
        <p className="um-empty">No users found.</p>
      ) : (
        <table className="um-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last Login</th>
              <th>Photo</th>
              <th>Source</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i}>
                <td className="um-cell-index">{i+1}</td>
                <td>{u.name || "—"}</td>
                <td>{u.email || "—"}</td>
                <td>{u.role || "user"}</td>
                <td>{u.loginTime ? new Date(u.loginTime).toLocaleString() : "—"}</td>
                <td>
                  {u.image ? (
                    <img src={u.image} alt="avatar" className="um-avatar-img" />
                  ) : (
                    <div className="um-avatar-placeholder">{(u.name||"?").charAt(0).toUpperCase()}</div>
                  )}
                </td>
                <td>{u._rawKey || "server"}</td>
                <td>
                  {u.id ? (
                    <button
                      className="btn-delete"
                      onClick={async () => {
                        if (!confirm(`Delete user ${u.name || u.email || u.id}? This cannot be undone.`)) return;
                        try {
                          const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken");
                          const headers = { "Content-Type": "application/json" };
                          if (token) headers["Authorization"] = `Bearer ${token}`;
                          const delRes = await fetch(`${API_USERS}/${u.id}`, { method: 'DELETE', headers });
                          if (!delRes.ok) {
                            const txt = await delRes.text().catch(() => delRes.statusText);
                            alert(`Delete failed: ${txt}`);
                            return;
                          }
                          // remove from UI
                          setUsers(prev => prev.filter(x => x.id !== u.id));
                        } catch (e) {
                          console.error(e);
                          alert('Delete failed');
                        }
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  );
}