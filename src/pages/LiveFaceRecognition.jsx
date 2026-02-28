import React, { useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 320,
  height: 240,
  facingMode: "user"
};

const LiveFaceRecognition = () => {
  const webcamRef = useRef(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    setLoading(true);
    try {
      // Send imageSrc (base64) to backend for recognition
      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc })
      });
      const data = await response.json();
      setResult(data.result || "No face recognized");
    } catch (err) {
      setResult("Recognition failed");
    }
    setLoading(false);
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Live Face Recognition</h2>
      <Webcam
        audio={false}
        height={240}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={320}
        videoConstraints={videoConstraints}
      />
      <div style={{ margin: "10px" }}>
        <button onClick={capture} disabled={loading}>
          {loading ? "Recognizing..." : "Capture & Recognize"}
        </button>
      </div>
      {result && <div><strong>Result:</strong> {result}</div>}
    </div>
  );
};

export default LiveFaceRecognition;
