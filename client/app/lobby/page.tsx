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
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    if (!AUTH.isLoggedIn()) { router.replace("/login"); return; }
    setUsername(AUTH.getUsername() || "");
    const fetchActive = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/game/active`, { headers: AUTH.authHeaders() });
        if (res.ok) {
          const { session } = await res.json();
          if (session) setActiveSession(session);
        }
      } catch { /* ignore */ }
    };
    fetchActive();
  }, [router]);

  const handleLogout = () => { AUTH.clearAuth(); router.push("/login"); };

  const handleCreate = async () => {
    setCreateLoading(true);
    setStatus("Status: Creating session...");
    try {
      const res = await fetch(`${SERVER_URL}/api/game/create`, { method: "POST", headers: AUTH.authHeaders() });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Could not create session."); setStatus("Status: Ready"); return; }
      updateState({ playerName: AUTH.getUsername(), sessionId: data.sessionId, role: data.role });
      router.push(`/waiting?sessionId=${data.sessionId}&role=${data.role}`);
    } catch {
      alert("Could not connect to server."); setStatus("Status: Ready");
    } finally { setCreateLoading(false); }
  };

  const handleJoin = async () => {
    const id = sessionInput.trim().toUpperCase();
    if (!id || id.length < 6) { alert("Enter a valid session ID!"); return; }
    setJoinLoading(true);
    setStatus("Status: Joining...");
    try {
      const res = await fetch(`${SERVER_URL}/api/game/join`, {
        method: "POST", headers: AUTH.authHeaders(), body: JSON.stringify({ sessionId: id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Could not join session."); setStatus("Status: Ready"); return; }
      updateState({ playerName: AUTH.getUsername(), sessionId: data.sessionId, role: data.role, currentStage: data.stage });
      router.push("/game");
    } catch {
      alert("Could not connect to server."); setStatus("Status: Ready");
    } finally { setJoinLoading(false); }
  };

  const handleRejoin = async () => {
    if (!activeSession) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/game/join`, {
        method: "POST", headers: AUTH.authHeaders(), body: JSON.stringify({ sessionId: activeSession.id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      updateState({ playerName: AUTH.getUsername(), sessionId: activeSession.id, role: data.role, currentStage: data.stage });
      router.push("/game");
    } catch { alert("Could not reconnect."); }
  };

  const btnBase =
    "py-3 px-5 border-2 border-[#1a1a1a] rounded-[10px] font-[900] text-[0.9rem] cursor-pointer shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-y-px active:shadow-[2px_2px_0_#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-[transform,box-shadow] duration-100 flex-1";
  const inputCls =
    "flex-1 bg-white/10 border border-white/20 rounded-[10px] px-4 py-[0.7rem] text-white font-bold text-[0.95rem] outline-none placeholder:text-white/45 focus:border-[#fbbf24] focus:shadow-[0_0_0_3px_rgba(251,191,36,0.2)] focus:bg-white/[0.18] transition-[border-color,box-shadow,background] duration-200";

  return (
    <div
      className="relative min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: 'url("/images/Background.jpeg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[rgba(10,5,30,0.75)] z-0" />

      {/* Lobby card */}
      <div
        className="relative z-10 rounded-[20px] px-12 py-10 w-[460px] text-center shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
        style={{
          background: "rgba(10,8,35,0.62)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1.5px solid rgba(255,255,255,0.18)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[1.8rem] text-[#fbbf24] mb-2" style={{ fontFamily: "var(--font-display)" }}>
            CodeCrafters <span>🏫</span>
          </h1>
          <button
            onClick={handleLogout}
            className="flex-none py-[0.4rem] px-[0.8rem] text-[0.8rem] bg-white/10 text-white border border-white/25 rounded-[10px] font-[900] cursor-pointer hover:-translate-y-0.5 hover:bg-white/20 active:translate-y-px transition-all duration-100"
            style={{ fontFamily: "var(--font)" }}
          >
            Logout
          </button>
        </div>

        <p className="text-white/75 mb-8 text-[0.95rem] font-bold">
          Welcome, <strong className="text-white">{username}</strong>!
        </p>

        {/* Active session banner */}
        {activeSession && (
          <div className="bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.5)] rounded-[10px] p-[0.85rem_1rem] mb-5 text-[0.85rem] text-left">
            <p className="text-white/90 font-bold mb-[0.6rem]">
              🎮 You have an active game (Session: <strong>{activeSession.id}</strong>, Stage{" "}
              <strong>{activeSession.stage}</strong>/5)
            </p>
            <button
              onClick={handleRejoin}
              className={`${btnBase} w-full bg-[#7c3aed] text-white`}
              style={{ fontFamily: "var(--font)" }}
            >
              Rejoin Game
            </button>
          </div>
        )}

        {/* Create / Join buttons */}
        <div className="flex gap-3 mb-4">
          <button
            disabled={createLoading}
            onClick={handleCreate}
            className={`${btnBase} bg-[#7c3aed] text-white`}
            style={{ fontFamily: "var(--font)" }}
          >
            {createLoading ? "Creating..." : "NEW GAME (Create ID)"}
          </button>
          <button
            onClick={() => setShowJoinPanel((v) => !v)}
            className={`${btnBase} bg-white/10 text-white border-white/25`}
            style={{ fontFamily: "var(--font)" }}
          >
            JOIN GAME (Enter ID)
          </button>
        </div>

        {/* Join panel */}
        {showJoinPanel && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter Session ID"
              maxLength={8}
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className={inputCls}
            />
            <button
              disabled={joinLoading}
              onClick={handleJoin}
              className="flex-none py-3 px-5 bg-[#7c3aed] text-white border-2 border-[#1a1a1a] rounded-[10px] font-[900] text-[0.9rem] cursor-pointer shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,box-shadow] duration-100"
              style={{ fontFamily: "var(--font)" }}
            >
              {joinLoading ? "Joining..." : "Join"}
            </button>
          </div>
        )}

        {/* Status */}
        <div className="mt-5 px-4 py-[0.6rem] bg-white/[0.07] border border-white/15 rounded-[8px] text-[0.85rem] text-white/60 font-bold">
          {status}
        </div>
      </div>
    </div>
  );
}
