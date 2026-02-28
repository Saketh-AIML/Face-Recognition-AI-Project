import { Outlet, Link } from "react-router-dom";

export default function App() {
  return (
    <div className="p-4">
      <nav className="navbar">
        <div className="navbar-brand">FaceRecognition</div>
        <div className="navbar-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="nav-link">Register</Link>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}