import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";

function WelcomePage() {
  const location = useLocation();
  const userName = location.state?.userName || "User";
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    if (seconds <= 0) {
      window.location.href = "https://mail.google.com";
      return;
    }
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  return (
    <div className="container">
      <h2 style={{ color: "#a78bfa", fontWeight: 900, marginBottom: "2rem" }}>
        Welcome, {userName}!
      </h2>
      <p>
        Redirecting to Gmail in <strong>{seconds}</strong> second{seconds !== 1 ? "s" : ""}.
      </p>
      <Link to="/" className="button secondary">
        Back to Home
      </Link>
    </div>
  );
}

export default WelcomePage;