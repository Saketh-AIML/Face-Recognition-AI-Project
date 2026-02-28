import React, { useEffect, useState } from "react";

function BackendLogs() {
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || "No logs found.");
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch logs");
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 20, background: "#222", color: "#fff", borderRadius: 8 }}>
      <h2>Backend Server Logs</h2>
      {loading && <p>Loading logs...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <pre style={{ background: "#111", padding: 16, borderRadius: 4, maxHeight: 400, overflow: "auto" }}>{logs}</pre>
    </div>
  );
}

export default BackendLogs;
