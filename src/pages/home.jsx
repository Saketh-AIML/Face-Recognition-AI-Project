import React from "react";
import { Link } from "react-router-dom";
import "./home.css";

function Home() {
  return (
    <div className="container">
      <h1>IdentiQ</h1>
      <p>Welcome to the Face Recognition App. This application allows you to scan and recognize faces.</p>
      <div className="button-container">
        <Link to="/login" className="button">
          Login
        </Link>
        <Link to="/register" className="button">
          Register a new user
        </Link>
        <Link to="/admin-login" className="button">
          Admin Login
        </Link>
      </div>
    </div>
  );
}

export default Home;