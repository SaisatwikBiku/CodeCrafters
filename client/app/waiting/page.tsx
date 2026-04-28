"use client";

import { useEffect, Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH } from "@/lib/auth";
import { useGame } from "@/lib/game-context";
import { SERVER_URL } from "../CONSTANT";
import { Layers, Hammer, Lightbulb, ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import { SFX } from "@/lib/sfx";
import { Music } from "@/lib/music";

const ROLE_TIPS: Record<string, string[]> = {
  Architect: [
    "The Architect designs the blueprint — think of yourself as the project manager!",
    "You'll get tasks that describe WHAT to build. Your partner codes the HOW.",
    "Tip: Read your task carefully before your partner joins.",
    "Architects earn XP for each building they complete with their Builder.",
  ],
  Builder: [
    "The Builder writes the Python code that makes the blueprint come to life!",
    "You'll solve coding challenges that match the Architect's design.",
    "Tip: Use the AI Study Buddy if you get stuck — no shame in asking for help!",
    "Builders get credit for every line of code that passes.",
  ],
};

function WaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, updateState } = useGame();
  const transitioningRef = useRef(false);
  const socketRef = useRef<any>(null);
  const [copied, setCopied] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  const sessionId = searchParams.get("sessionId") || state.sessionId || "------";
  const role = searchParams.get("role") || state.role || "Architect";
  const shareLink =
    typeof window !== "undefined" && sessionId && sessionId !== "------"
      ? `${window.location.origin}/lobby?sessionId=${encodeURIComponent(sessionId)}`
      : "";

  const tips = ROLE_TIPS[role] ?? ROLE_TIPS["Architect"];

  useEffect(() => {
    const t = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 4000);
    return () => clearInterval(t);
  }, [tips.length]);

  const handleCancel = async () => {
    if (!confirm("Cancel this session? You'll be taken back to the dashboard.")) return;
    setCancelling(true);
    try {
      await fetch(`${SERVER_URL}/api/game/abandon`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH.getToken()}` },
      });
    } catch { /* navigate away regardless */ }
    const socket = socketRef.current;
    if (socket) { socket.disconnect(); socketRef.current = null; }
    router.replace("/dashboard");
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      alert("Could not copy link. Please copy it manually.");
    }
  };

  useEffect(() => {
    Music.play("waiting");
    return () => { Music.stop(); };
  }, []);

  useEffect(() => {
    if (!AUTH.isLoggedIn()) { router.replace("/login"); return; }
    if (!sessionId || sessionId === "------") { router.replace("/lobby"); return; }

    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const transitionToGame = (gameState: any, socket?: any) => {
      if (transitioningRef.current) return;
      if (!gameState?.players?.Architect || !gameState?.players?.Builder) return;
      transitioningRef.current = true;
      updateState({
        socket: socket || socketRef.current,
        sessionId: gameState.sessionId || sessionId,
        playerName: AUTH.getUsername(),
        role: role as any,
        currentStage: gameState.stage,
        level: (gameState.level ?? 1) as 1 | 2 | 3,
        score: gameState.score,
        completedStages: gameState.stage - 1,
      });
      router.replace("/game");
    };

    const connectSocket = async () => {
      const { io } = await import("socket.io-client");
      const socket = io(SERVER_URL, { auth: { token: AUTH.getToken() }, reconnection: true, reconnectionAttempts: 8 });
      socketRef.current = socket;
      socket.on("connect", () => {
        updateState({ socket, sessionId, playerName: AUTH.getUsername(), role: role as any });
        socket.emit("join_room", { sessionId, playerName: AUTH.getUsername(), role });
      });
      socket.on("player_joined", ({ state: gameState }: any) => { SFX.partnerJoined(); transitionToGame(gameState, socket); });
      socket.on("error", ({ message }: any) => { alert("Server error: " + message); });
    };

    const checkSessionReady = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/game/${sessionId}`, { headers: AUTH.authHeaders() });
        if (!res.ok) return;
        const gameState = await res.json();
        transitionToGame(gameState);
      } catch { /* ignore */ }
    };

    connectSocket();
    checkSessionReady();
    pollTimer = setInterval(checkSessionReady, 1500);

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      const socket = socketRef.current;
      if (socket) {
        socket.off("connect"); socket.off("player_joined");
        socket.off("connect_error"); socket.off("error");
      }
      if (!transitioningRef.current) { socket?.disconnect(); socketRef.current = null; }
    };
  }, [sessionId, role, router, updateState]);

  const isArchitect = role === "Architect";
  const roleColor = isArchitect ? "#fbbf24" : "#a78bfa";
  const roleBg    = isArchitect ? "#fbbf24" : "#7c3aed";
  const roleText  = isArchitect ? "#1a1a1a" : "#ffffff";
  const RoleIcon  = isArchitect ? Layers : Hammer;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #0d0b1e 0%, #1a0a2e 50%, #0d0b1e 100%)" }}
    >
      <div className="fixed top-0 left-0 w-64 h-64 rounded-full bg-[#7c3aed]/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full bg-[#fbbf24]/5 blur-3xl pointer-events-none" />

      <div
        className="relative z-10 rounded-3xl p-8 w-full max-w-md text-white"
        style={{
          background: "rgba(13,11,30,0.85)",
          border: "1.5px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 12px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-2xl text-white font-black" style={{ fontFamily: "var(--font-display)" }}>
            Code<span style={{ color: "#fbbf24" }}>Crafters!</span>
          </h1>
        </div>

        {/* Role badge */}
        <div className="flex justify-center mb-5">
          <span
            className="inline-flex items-center gap-2 text-sm font-black px-4 py-2 rounded-full border-2 border-[#1a1a1a] shadow-[var(--shadow-sm)]"
            style={{ background: roleBg, color: roleText }}
          >
            <RoleIcon size={14} />
            You are the {role}
          </span>
        </div>

        {/* Session ID */}
        <div className="text-center mb-2">
          <p className="text-white/50 text-sm font-bold mb-2">Share this session ID with your partner:</p>
          <div
            className="text-[2.2rem] font-black tracking-[0.3em] py-4 rounded-2xl mb-3"
            style={{
              fontFamily: "var(--font-display)",
              color: roleColor,
              background: "rgba(255,255,255,0.05)",
              border: "2px solid rgba(255,255,255,0.1)",
              textShadow: `0 0 20px ${roleColor}55`,
            }}
          >
            {sessionId}
          </div>
        </div>

        {/* Share link */}
        <div className="mb-5">
          <p className="text-white/40 text-[11px] font-bold mb-1.5">Or share this link:</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareLink}
              className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-[0.72rem] font-bold text-white/60 outline-none"
            />
            <button
              onClick={copyShareLink}
              className="flex-none flex items-center gap-1.5 py-2 px-4 bg-[#7c3aed] text-white border-2 border-[#1a1a1a] rounded-xl font-black text-[0.78rem] hover:-translate-y-0.5 transition-all shadow-[var(--shadow-sm)]"
            >
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
        </div>

        {/* Waiting animation */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative flex items-center justify-center">
            <div
              className="w-14 h-14 rounded-full border-4"
              style={{ borderColor: "rgba(255,255,255,0.08)", borderTopColor: roleColor, animation: "spin 1s linear infinite" }}
            />
            <RoleIcon size={20} className="absolute" style={{ color: roleColor }} />
          </div>
          <p className="text-white/60 text-sm font-bold">Waiting for your partner to join...</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30"
                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>

        {/* Cancel / Back */}
        <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-[11px] text-white/30 font-bold hover:text-white/55 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Dashboard
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-[11px] text-red-400/60 font-bold hover:text-red-400 transition-colors disabled:opacity-40"
          >
            {cancelling ? <Loader2 size={12} className="animate-spin inline" /> : null}
            {cancelling ? " Cancelling..." : "Cancel Session"}
          </button>
        </div>

        {/* Rotating tip */}
        <div className="mt-4 rounded-2xl px-4 py-3.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="flex items-center gap-1.5 text-[10px] font-black tracking-widest mb-1" style={{ color: roleColor }}>
            <Lightbulb size={11} />
            DID YOU KNOW?
          </p>
          <p className="text-white/65 text-[12.5px] font-bold leading-snug">{tips[tipIndex]}</p>
        </div>
      </div>
    </div>
  );
}

export default function WaitingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #0d0b1e 0%, #1a0a2e 100%)" }}>
        <div className="spinner" />
      </div>
    }>
      <WaitingContent />
    </Suspense>
  );
}
