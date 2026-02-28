import React, { useEffect, useState, useRef } from "react";

const LOCK_DURATION = 30; // seconds

function LoginHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [countdown, setCountdown] = useState(LOCK_DURATION);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/login-logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);

        // Check if the latest log is a lock
        const lastLog = data.logs && data.logs[0];
        if (lastLog && lastLog.status === "locked") {
          setLocked(true);
          setCountdown(LOCK_DURATION);
        } else {
          setLocked(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (locked) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [locked]);

  // Circular timer SVG
  const radius = 24;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = countdown / LOCK_DURATION;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="container">
      <h2 style={{ color: "#a78bfa", marginBottom: "1.5rem" }}>Login History</h2>
      {locked && (
        <div style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          background: "#2e335a",
          borderRadius: "8px",
          color: "#ff6b81",
          textAlign: "center",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem"
        }}>
          {/* Circular timer animation */}
          <svg height={radius * 2} width={radius * 2}>
            <circle
              stroke="#181c2f"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke="#ff6b81"
              fill="transparent"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset, transition: "stroke-dashoffset 1s linear" }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dy=".3em"
              fontSize="1.1em"
              fill="#a78bfa"
            >
              {countdown}s
            </text>
          </svg>
          <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
            Too many failed attempts.<br />
            Please wait <span style={{ color: "#a78bfa" }}>{countdown}s</span> to retry.
            <div style={{
              marginTop: "0.5rem",
              height: "8px",
              width: "100%",
              background: "#181c2f",
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                height: "100%",
                width: `${progress * 100}%`,
                background: "#ff6b81",
                transition: "width 1s linear"
              }} />
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : logs.length === 0 ? (
        <p>No login history found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#23264a",
            borderRadius: "10px",
            overflow: "hidden"
          }}>
            <thead>
              <tr style={{ background: "#181c2f", color: "#a78bfa" }}>
                <th style={{ padding: "10px" }}>Time</th>
                <th style={{ padding: "10px" }}>Username</th>
                <th style={{ padding: "10px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #2e335a" }}>
                  <td style={{ padding: "10px", color: "#b0b3c7" }}>
                    {new Date(log.time).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px", color: "#e5e7fa" }}>{log.username}</td>
                  <td style={{ padding: "10px" }}>
                    <span style={{
                      color:
                        log.status === "success"
                          ? "#28e07a"
                          : log.status === "locked"
                          ? "#ff6b81"
                          : "#ffb347",
                      fontWeight: "bold"
                    }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LoginHistory;