import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import "./home.css";

function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [capturedImage, setCapturedImage] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Registering...");
    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          image: capturedImage // base64 string
        })
      });

      const data = await response.json();
      if (response.ok) {
        // Save into localStorage users array so admin can view all registered users
        try {
          const key = "users";
          const raw = localStorage.getItem(key);
          let list = [];
          if (raw) {
            try { list = JSON.parse(raw) || []; } catch { list = []; }
          }

          // normalize new user object
          const newUser = {
            name: form.username,
            email: form.email,
            role: "user",
            loginTime: new Date().toISOString(),
            image: capturedImage || null
          };

          // dedupe by email
          const exists = list.some(u => u && ((u.email || "").toLowerCase() === (newUser.email || "").toLowerCase()));
          if (!exists) list.push(newUser);
          else {
            // update existing entry's data (image/loginTime)
            list = list.map(u => ((u.email || "").toLowerCase() === (newUser.email || "").toLowerCase()) ? { ...u, ...newUser } : u);
          }

          localStorage.setItem(key, JSON.stringify(list));
        } catch (err) {
          console.error("Failed to write registered user to localStorage:", err);
        }

        setMessage("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setMessage(data.error || "Registration failed.");
      }
    } catch (err) {
      setMessage("Error connecting to server.");
    }
  };

  return (
    <div className="container">
      <h1>Register</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
          className="input"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="input"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="input"
        />

        <div className="photo-flex">
          {!capturedImage ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={140}
                height={110}
                videoConstraints={{ facingMode: "user" }}
                className="photo-preview"
                style={{ borderRadius: "8px" }}
              />
              <button type="button" className="button retake-btn" onClick={capture}>
                Capture Photo
              </button>
            </>
          ) : (
            <>
              <img src={capturedImage} alt="Captured" className="photo-preview" />
              <button type="button" className="button retake-btn" onClick={() => setCapturedImage(null)}>
                Retake Photo
              </button>
            </>
          )}
        </div>

        <button type="submit" className="button" style={{ padding: "12px", fontWeight: "bold" }} disabled={!capturedImage}>
          Register
        </button>
      </form>
      {message && <p style={{ color: "#fff", marginTop: "1rem", textAlign: "center" }}>{message}</p>}
      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>

      </div>
    </div>
  );
}

export default Register;