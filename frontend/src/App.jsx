import { useState, useRef } from "react";
import axios from "axios";

function App() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 🎤 Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 }});
      audioChunksRef.current = []; // clear old chunks

      // Pick the best supported type
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
      ];
      let mime = "";
      for (const t of preferredTypes) {
        if (MediaRecorder.isTypeSupported(t)) {
          mime = t;
          break;
        }
      }

      const options = mime ? { mimeType: mime } : undefined;
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      mediaRecorderRef.current.start(); // no timeslice for simplicity
      setRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      setResponse("❌ Mic access denied. Please enable microphone permissions.");
    }
  };

  // ⏹ Stop recording
  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    await new Promise((resolve) => {
      const onStop = () => {
        mediaRecorderRef.current.removeEventListener("stop", onStop);
        resolve();
      };
      mediaRecorderRef.current.addEventListener("stop", onStop);
      mediaRecorderRef.current.stop();
    });

    setRecording(false);

    if (!audioChunksRef.current.length) {
      setResponse("❌ No audio captured. Try again.");
      return;
    }

    const blobType = audioChunksRef.current[0]?.type || "audio/webm";
    const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
    audioChunksRef.current = [];

    await sendRequest(audioBlob);
  };

  // 🚀 Send query to backend
  const sendRequest = async (audioBlob = null) => {
    try {
      let res;

      if (audioBlob) {
        const formData = new FormData();
        // must match backend multer field name
        formData.append("audio", audioBlob, "query.webm");

        // send to the voice endpoint — do NOT set Content-Type manually
        res = await axios.post("http://localhost:5000/api/query", formData);
      } else {
        // text path expects JSON params for WRIS route
        res = await axios.post("http://localhost:5000/api/query", {
          userQuery: query,
        });
      }

      // show backend-provided summary or transcript
      setResponse(res.data.summary || res.data.transcript || JSON.stringify(res.data));
    } catch (err) {
      console.error("Request error:", err);
      console.error("Backend response:", err?.response?.data);
      // surface backend message if present
      const backendMsg =
        err?.response?.data?.error ||
        err?.response?.data ||
        err?.message ||
        "❌ Error calling backend";
      setResponse(String(backendMsg));
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🎤 INGRES Chatbot</h1>

      {/* Text input */}
      <textarea
        rows="3"
        style={{ width: "100%", padding: "10px" }}
        placeholder="Type your query..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div style={{ marginTop: "1rem" }}>
        <button onClick={() => sendRequest()} disabled={!query}>
          📤 Send Text
        </button>

        <button
          onClick={recording ? stopRecording : startRecording}
          style={{ marginLeft: "1rem" }}
        >
          {recording ? "⏹ Stop Recording" : "🎙 Start Recording"}
        </button>
      </div>

      {/* Response */}
      <div style={{ marginTop: "2rem" }}>
        <h3>✅ Response:</h3>
        <p>{response}</p>
      </div>
    </div>
  );
}

export default App;
