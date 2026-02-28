import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import axios from "axios";

// API configuration - can be moved to an environment variable or config file
const API_URL = "http://localhost:5000/api/recognize";

function Login() {
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  
  // Consolidated state
  const [state, setState] = useState({
    authStatus: "waiting",
    isLoading: true,
    error: null,
    cameraReady: false,
    initializationTimeout: false,
    capturedImage: null,
    apiLoading: false,
    userName: null,
    apiError: null
  });

  // Destructure state for easier access
  const { authStatus, isLoading, error, cameraReady, initializationTimeout, capturedImage, apiLoading, userName, apiError } = state;

  // Update state helper function
  const updateState = (newState) => setState(prev => ({ ...prev, ...newState }));

  // Set a timeout for camera initialization
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        updateState({ initializationTimeout: true });
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Camera handlers
  const handleUserMedia = () => {
    updateState({ isLoading: false, cameraReady: true, error: null });
  };

  const handleUserMediaError = (err) => {
    updateState({ 
      isLoading: false, 
      cameraReady: false, 
      error: "Camera access denied or camera not available. Please check your permissions." 
    });
  };

  const retryCamera = () => {
    updateState({ 
      isLoading: true, 
      error: null, 
      initializationTimeout: false, 
      cameraReady: false 
    });
    if (webcamRef.current) webcamRef.current = null;
    setTimeout(() => updateState({ isLoading: true }), 100);
  };

  // Capture screenshot from webcam
  const captureImage = useCallback(() => {
    if (!webcamRef.current) {
      updateState({ error: "Camera not ready. Please wait or refresh the page." });
      return null;
    }
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        updateState({ capturedImage: imageSrc });
        return imageSrc;
      } else {
        updateState({ error: "Failed to capture image. Please try again." });
        return null;
      }
    } catch (err) {
      updateState({ error: "Error capturing image: " + err.message });
      return null;
    }
  }, [webcamRef]);

  // Start face recognition process (REAL: use backend API)
  const startFaceRecognition = async () => {
    if (!cameraReady) {
      updateState({ error: "Camera is not ready. Please wait or retry camera initialization." });
      return;
    }
    const imageSrc = captureImage();
    if (!imageSrc) return;
    updateState({ apiLoading: true, authStatus: "scanning", apiError: null });
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc })
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        // Store user info in localStorage
        const userObj = {
          name: data.userName,
          loginTime: new Date().toISOString(),
          authenticated: true
        };
        localStorage.setItem('user', JSON.stringify(userObj));
        updateState({ authStatus: "success", userName: data.userName, apiLoading: false });
        // Redirect to welcomepage after a short delay
        setTimeout(() => {
          navigate("/welcomepage", { state: { userName: data.userName, loginTime: userObj.loginTime } });
        }, 1200); // 1.2 seconds for user to see welcome
      } else {
        updateState({ authStatus: "error", apiError: data.error || "Authentication failed.", apiLoading: false });
      }
    } catch (err) {
      updateState({ authStatus: "error", apiError: "Error connecting to server.", apiLoading: false });
    }
  };

  // Status message helpers
  const getStatusMessage = () => {
    if (apiLoading) {
      return "Processing your face data...";
    }
    if (apiError) {
      return apiError;
    }
    const messages = {
      waiting: "Waiting for face detection to start...",
      scanning: "Scanning your face, please remain still...",
      success: userName ? `Welcome, ${userName}!` : "Authentication successful!",
      error: "Authentication failed. Please try again."
    };
    return messages[authStatus] || messages.waiting;
  };

  const getStatusClass = () => {
    const baseClass = "status-message";
    const statusClasses = {
      success: `${baseClass} success`,
      error: `${baseClass} error`,
      scanning: `${baseClass} scanning`
    };
    return statusClasses[authStatus] || baseClass;
  };

  // Video constraints
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user",
    aspectRatio: 1.333,
    frameRate: { ideal: 30, max: 60 }
  };

  // Styles
  const styles = {
    container: { maxWidth: "800px", margin: "0 auto", padding: "20px" },
    heading: { textAlign: "center", marginBottom: "20px" },
    timeoutAlert: { 
      backgroundColor: "#fff3cd", 
      color: "#856404", 
      padding: "10px", 
      borderRadius: "5px", 
      marginBottom: "15px",
      textAlign: "center"
    },
    retryButton: { 
      padding: "8px 16px", 
      backgroundColor: "#ffc107", 
      color: "#000", 
      border: "none", 
      borderRadius: "5px", 
      cursor: "pointer",
      marginTop: "10px"
    },
    cameraContainer: { 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center",
      marginBottom: "20px",
      background: "none", 
      padding: 0,         
      borderRadius: "16px", 
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      position: "relative",
      minHeight: "auto",
      width: "100%",
    },
    errorMessage: { 
      color: "red", 
      padding: "20px", 
      border: "1px solid red", 
      borderRadius: "5px",
      backgroundColor: "#ffebee",
      width: "100%",
      textAlign: "center"
    },
    errorRetryButton: { 
      padding: "8px 16px", 
      backgroundColor: "#f44336", 
      color: "white", 
      border: "none", 
      borderRadius: "5px", 
      cursor: "pointer",
      marginTop: "10px"
    },
    webcamWrapper: { 
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: "640px",
      margin: "0 auto",
      position: "relative"
    },
    spinner: { 
      width: "50px", 
      height: "50px", 
      border: "5px solid #f3f3f3", 
      borderTop: "5px solid #3498db", 
      borderRadius: "50%",
      margin: "10px auto",
      animation: "spin 2s linear infinite"
    },
    webcam: { 
      borderRadius: "16px", 
      border: "4px solid #fff",
      boxShadow: "0 4px 24px rgba(0,0,0,0.25)", 
      maxWidth: "100%",
      height: "auto",
      display: cameraReady ? "block" : "none",
      background: "#222"
    },
    cameraActive: { 
      position: "absolute", 
      bottom: "10px", 
      left: "50%", 
      transform: "translateX(-50%)",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      color: "white",
      padding: "5px 10px",
      borderRadius: "5px",
      fontSize: "12px"
    },
    statusMessage: { 
      textAlign: "center", 
      padding: "10px", 
      marginBottom: "20px",
      backgroundColor: authStatus === "success" ? "#d4edda" : 
                      authStatus === "error" ? "#f8d7da" : 
                      authStatus === "scanning" ? "#cce5ff" : "#f8f9fa",
      color: authStatus === "success" ? "#155724" : 
            authStatus === "error" ? "#721c24" : 
            authStatus === "scanning" ? "#004085" : "#212529",
      borderRadius: "5px"
    },
    buttonContainer: { 
      display: "flex", 
      justifyContent: "center", 
      marginBottom: "20px" 
    },
    loginButton: { 
      padding: "12px 24px", 
      backgroundColor: "#4CAF50", 
      color: "white", 
      border: "none", 
      borderRadius: "5px", 
      cursor: (authStatus === "scanning" || !cameraReady || isLoading || error) ? "not-allowed" : "pointer",
      opacity: (authStatus === "scanning" || !cameraReady || isLoading || error) ? 0.5 : 1,
      fontSize: "16px",
      fontWeight: "bold"
    },
    navigationOptions: { 
      display: "flex", 
      justifyContent: "center" 
    },
    backButton: { 
      padding: "10px 20px", 
      backgroundColor: "#6c757d", 
      color: "white", 
      border: "none", 
      borderRadius: "5px", 
      textDecoration: "none",
      display: "inline-block"
    },
    capturedImageContainer: { 
      marginTop: "20px", 
      textAlign: "center",
      backgroundColor: "#f5f5f5",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
    },
    capturedImage: { 
      maxWidth: "300px", 
      borderRadius: "5px",
      border: "1px solid #ccc"
    }
  };

  return (
    <div className="container" style={styles.container}>
      <h1 style={styles.heading}>Login</h1>
      <p style={styles.heading}>Please position your face in front of the camera for authentication.</p>
      
      {initializationTimeout && !cameraReady && !error && (
        <div style={styles.timeoutAlert}>
          <p><strong>Camera is taking longer than expected to initialize.</strong></p>
          <p>Please make sure you've allowed camera access in your browser.</p>
          <p>Check your browser settings or try using a different browser.</p>
          <button onClick={retryCamera} style={styles.retryButton}>
            Retry Camera
          </button>
        </div>
      )}
      
      <div className="camera-container" style={styles.cameraContainer}>
        {error ? (
          <div className="error-message" style={styles.errorMessage}>
            <p><strong>Error:</strong> {error}</p>
            <p>Please check that:</p>
            <ul style={{ textAlign: "left", marginLeft: "30px" }}>
              <li>Your camera is connected and working</li>
              <li>You've allowed camera access in your browser</li>
              <li>No other application is using your camera</li>
            </ul>
            <button onClick={retryCamera} style={styles.errorRetryButton}>
              Retry Camera
            </button>
          </div>
        ) : (
          <div style={styles.webcamWrapper}>
            {isLoading && (
              <div className="loading-message" style={styles.loadingMessage}>
                <p><strong>Initializing camera...</strong></p>
                <p>Please allow camera access when prompted by your browser.</p>
                <div style={styles.spinner}></div>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={640}
              height={480}
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              mirrored={true}
              style={styles.webcam}
            />
            {!isLoading && cameraReady && (
              <div style={styles.cameraActive}>
                Camera active
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className={getStatusClass()} style={styles.statusMessage}>
        <p>{getStatusMessage()}</p>
        {apiLoading && (
          <div>
            <div style={styles.spinner}></div>
            <p style={{ marginTop: "10px", fontSize: "14px" }}>Communicating with server...</p>
          </div>
        )}
        {authStatus === "error" && (
          <button
            onClick={startFaceRecognition}
            style={{
              ...styles.loginButton,
              backgroundColor: "#ffc107",
              color: "#000",
              marginTop: "10px"
            }}
          >
            Retry
          </button>
        )}
      </div>
      
      <div className="button-container" style={styles.buttonContainer}>
        <button 
          className="button" 
          onClick={startFaceRecognition}
          disabled={authStatus === "scanning" || !cameraReady || isLoading || error || apiLoading}
          style={styles.loginButton}
        >
          {authStatus === "waiting" ? "Login with Face ID" : apiLoading ? "Processing..." : "Scanning..."}
        </button>
      </div>
      
      <div className="navigation-options" style={styles.navigationOptions}>
        <Link to="/" className="button secondary" style={styles.backButton}>
          Back to Home
        </Link>
      </div>
      
      {capturedImage && authStatus === "success" && (
        <div style={styles.capturedImageContainer}>
          <h3>Authenticated Face:</h3>
          <img src={capturedImage} alt="Authenticated Face" style={styles.capturedImage} />
          <p style={{ fontSize: "12px", marginTop: "10px" }}>
            Base64 image data has been logged to the console.
          </p>
        </div>
      )}
    </div>
  );
}

export default Login;