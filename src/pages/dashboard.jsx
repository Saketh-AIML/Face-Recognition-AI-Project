// ...existing code...
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// Helper function to calculate session duration
const getSessionDuration = (loginTime) => {
  const loginDate = new Date(loginTime);
  const now = new Date();
  const diffMs = now - loginDate;
  
  // Convert to minutes and seconds
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  
  if (diffMins < 1) {
    return `${diffSecs} seconds`;
  } else if (diffMins === 1) {
    return `1 minute ${diffSecs} seconds`;
  } else {
    return `${diffMins} minutes ${diffSecs} seconds`;
  }
};

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize state from location or localStorage
  const [userData, setUserData] = useState(() => {
    // First try to get data from location state (direct navigation)
    if (location.state?.userName) {
      return {
        userName: location.state.userName,
        loginTime: location.state.loginTime
      };
    }
    
    // If not available, try localStorage (page refresh or direct URL access)
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.authenticated) {
          return {
            userName: parsedUser.name,
            loginTime: parsedUser.loginTime
          };
        }
      }
    } catch (err) {
      console.error("Error reading from localStorage:", err);
    }
    
    // If no data is available, return null
    return null;
  });

  // user-management is now a separate page; dashboard links to it

  // Redirect to login if no user data is available
  useEffect(() => {
    if (!userData) {
      navigate("/login");
    }
  }, [userData, navigate]);
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate("/login");
  };

  // Format the login time for display
  const formattedTime = userData?.loginTime ? new Date(userData.loginTime).toLocaleTimeString() : "";
  const formattedDate = userData?.loginTime ? new Date(userData.loginTime).toLocaleDateString() : "";

  // Styles
  const styles = {
    container: { 
      maxWidth: "800px", 
      margin: "0 auto", 
      padding: "20px" 
    },
    header: { 
      textAlign: "center", 
      marginBottom: "30px" 
    },
    welcomeCard: {
      backgroundColor: "#f5f5f5",
      padding: "30px",
      borderRadius: "10px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      marginBottom: "30px",
      textAlign: "center",
      position: "relative"
    },
    welcomeMessage: {
      fontSize: "24px",
      color: "#4CAF50",
      marginBottom: "15px"
    },
    loginInfo: {
      fontSize: "16px",
      color: "#666",
      marginBottom: "5px"
    },
    userAvatar: {
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      backgroundColor: "#4CAF50",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
      fontWeight: "bold",
      margin: "20px auto 0",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
    },
    statsContainer: {
      display: "flex",
      justifyContent: "space-between",
      gap: "20px",
      marginBottom: "30px"
    },
    statCard: {
      flex: 1,
      backgroundColor: "#f5f5f5",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      textAlign: "center"
    },
    statTitle: {
      fontSize: "16px",
      color: "#666",
      marginBottom: "10px"
    },
    statValue: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#333"
    },
    buttonContainer: { 
      display: "flex", 
      justifyContent: "center", 
      gap: "15px", 
      marginTop: "30px" 
    },
    button: { 
      padding: "12px 24px", 
      backgroundColor: "#2196F3", 
      color: "white", 
      border: "none", 
      borderRadius: "5px", 
      textDecoration: "none",
      display: "inline-block",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer"
    },
    logoutButton: {
      backgroundColor: "#f44336"
    },
    historyButton: {
      backgroundColor: "#7c3aed"
    },
    loadingContainer: {
      textAlign: "center",
      padding: "50px 0"
    },
    spinner: { 
      width: "50px", 
      height: "50px", 
      border: "5px solid #f3f3f3", 
      borderTop: "5px solid #3498db", 
      borderRadius: "50%",
      margin: "0 auto 20px",
      animation: "spin 2s linear infinite"
    },
    // New styles for user management panel
    userMgmtCard: {
      marginTop: "30px",
      padding: "20px",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
    },
    userTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "12px"
    },
    userTh: {
      textAlign: "left",
      padding: "8px",
      borderBottom: "1px solid #eaeaea",
      fontSize: "14px",
      color: "#555"
    },
    userTd: {
      padding: "8px",
      borderBottom: "1px solid #f1f1f1",
      fontSize: "14px",
      color: "#333"
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>IdentiQ Dashboard</h1>
      </header>

      {userData ? (
        <>
          <div style={styles.welcomeCard}>
            <div style={styles.welcomeMessage}>
              Welcome, {userData.userName}!
            </div>
            {userData.loginTime && (
              <div>
                <p style={styles.loginInfo}>You logged in on {formattedDate}</p>
                <p style={styles.loginInfo}>at {formattedTime}</p>
              </div>
            )}
            <div style={styles.userAvatar}>
              {userData.userName.charAt(0).toUpperCase()}
            </div>
          </div>

          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <h3 style={styles.statTitle}>Last Login</h3>
              <p style={styles.statValue}>{formattedDate}</p>
            </div>
            <div style={styles.statCard}>
              <h3 style={styles.statTitle}>Session Duration</h3>
              <p style={styles.statValue}>
                {userData.loginTime ? 
                  getSessionDuration(userData.loginTime) : 
                  "Unknown"}
              </p>
            </div>
          </div>

          <div style={styles.buttonContainer}>
            <Link to="/" style={styles.button}>
              Home
            </Link>
            <Link to="/login-history" style={{...styles.button, ...styles.historyButton}}>
              View Login History
            </Link>

            {/* New User Management link */}
            <Link to="/user-management" style={{...styles.button, backgroundColor: "#4CAF50"}}>
              User Management
            </Link>

            <button 
              onClick={handleLogout} 
              style={{...styles.button, ...styles.logoutButton}}
            >
              Logout
            </button>
          </div>

          {/* user-management moved to its own page */}

        </>
      ) : (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading user data...</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
// ...existing code...