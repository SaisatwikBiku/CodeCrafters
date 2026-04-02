"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH } from "@/lib/auth";
import { useGame } from "@/lib/game-context";
import { ActiveSession } from "@/types";
import { SERVER_URL } from "../CONSTANT";

export default function LobbyPage() {
  const router = useRouter();
  const { updateState } = useGame();

  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("Status: Ready");
  const [showJoinPanel, setShowJoinPanel] = useState(false);
  const [sessionInput, setSessionInput] = useState("");
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null,
  );
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    // Guard: must be logged in
    if (!AUTH.isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setUsername(AUTH.getUsername() || "");

    // Check for an active session to resume
    const fetchActive = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/game/active`, {
          headers: AUTH.authHeaders(),
        });
        if (res.ok) {
          const { session } = await res.json();
          if (session) setActiveSession(session);
        }
      } catch {
        // ignore
      }
    };
    fetchActive();
  }, [router]);

  const handleLogout = () => {
    AUTH.clearAuth();
    router.push("/login");
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    setStatus("Status: Creating session...");
    try {
      const res = await fetch(`${SERVER_URL}/api/game/create`, {
        method: "POST",
        headers: AUTH.authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not create session.");
        setStatus("Status: Ready");
        return;
      }
      updateState({
        playerName: AUTH.getUsername(),
        sessionId: data.sessionId,
        role: data.role,
      });
      router.push(`/waiting?sessionId=${data.sessionId}&role=${data.role}`);
    } catch {
      alert("Could not connect to server.");
      setStatus("Status: Ready");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoin = async () => {
    const id = sessionInput.trim().toUpperCase();
    if (!id || id.length < 6) {
      alert("Enter a valid session ID!");
      return;
    }
    setJoinLoading(true);
    setStatus("Status: Joining...");
    try {
      const res = await fetch(`${SERVER_URL}/api/game/join`, {
        method: "POST",
        headers: AUTH.authHeaders(),
        body: JSON.stringify({ sessionId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not join session.");
        setStatus("Status: Ready");
        return;
      }
      updateState({
        playerName: AUTH.getUsername(),
        sessionId: data.sessionId,
        role: data.role,
        currentStage: data.stage,
      });
      router.push("/game");
    } catch {
      alert("Could not connect to server.");
      setStatus("Status: Ready");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleRejoin = async () => {
    if (!activeSession) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/game/join`, {
        method: "POST",
        headers: AUTH.authHeaders(),
        body: JSON.stringify({ sessionId: activeSession.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      updateState({
        playerName: AUTH.getUsername(),
        sessionId: activeSession.id,
        role: data.role,
        currentStage: data.stage,
      });
      router.push("/game");
    } catch {
      alert("Could not reconnect.");
    }
  };

  return (
    <div
      className="lobby-bg-screen"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10, 5, 30, 0.75)",
          zIndex: 0,
        }}
      />

      <div
        className="lobby-card glass-box"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* Header */}
        <div className="lobby-header">
          <h1 className="logo">
            CodeCrafters <span>🏫</span>
          </h1>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <p className="tagline">
          Welcome, <strong>{username}</strong>!
        </p>

        {/* Active session banner */}
        {activeSession && (
          <div className="active-banner">
            <p>
              🎮 You have an active game (Session:{" "}
              <strong>{activeSession.id}</strong>, Stage{" "}
              <strong>{activeSession.stage}</strong>/5)
            </p>
            <button className="btn btn-primary" onClick={handleRejoin}>
              Rejoin Game
            </button>
          </div>
        )}

        {/* Create / Join buttons */}
        <div className="button-row">
          <button
            className="btn btn-primary"
            disabled={createLoading}
            onClick={handleCreate}
          >
            {createLoading ? "Creating..." : "NEW GAME (Create ID)"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowJoinPanel((v) => !v)}
          >
            JOIN GAME (Enter ID)
          </button>
        </div>

        {/* Join panel */}
        {showJoinPanel && (
          <div id="join-panel">
            <input
              type="text"
              placeholder="Enter Session ID"
              maxLength={8}
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <button
              className="btn btn-primary"
              disabled={joinLoading}
              onClick={handleJoin}
            >
              {joinLoading ? "Joining..." : "Join"}
            </button>
          </div>
        )}

        <div className="status-area">{status}</div>
      </div>
    </div>
  );
}
