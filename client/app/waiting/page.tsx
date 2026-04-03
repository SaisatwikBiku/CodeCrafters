"use client";

import { useEffect, Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH } from "@/lib/auth";
import { useGame } from "@/lib/game-context";
import { SERVER_URL } from "../CONSTANT";

function WaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, updateState } = useGame();
  const transitioningRef = useRef(false);
  const socketRef = useRef<any>(null);
  const [copied, setCopied] = useState(false);

  const sessionId = searchParams.get("sessionId") || state.sessionId || "------";
  const role = searchParams.get("role") || state.role || "Architect";
  const shareLink =
    typeof window !== "undefined" && sessionId && sessionId !== "------"
      ? `${window.location.origin}/lobby?sessionId=${encodeURIComponent(sessionId)}`
      : "";

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
        score: gameState.score,
        completedStages: gameState.stage - 1,
      });
      router.replace("/game");
    };

    const connectSocket = async () => {
      const { io } = await import("socket.io-client");
      const socket = io(SERVER_URL, {
        auth: { token: AUTH.getToken() },
        reconnection: true,
        reconnectionAttempts: 8,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        updateState({ socket, sessionId, playerName: AUTH.getUsername(), role: role as any });
        socket.emit("join_room", { sessionId, playerName: AUTH.getUsername(), role });
      });

      socket.on("player_joined", ({ state: gameState }: any) => {
        transitionToGame(gameState, socket);
      });

      socket.on("connect_error", () => {
        // Poll fallback below handles transition if socket is temporarily unstable.
      });

      socket.on("error", ({ message }: any) => { alert("Server error: " + message); });
    };

    const checkSessionReady = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/game/${sessionId}`, { headers: AUTH.authHeaders() });
        if (!res.ok) return;
        const gameState = await res.json();
        transitionToGame(gameState);
      } catch {
        // Ignore transient fetch errors while waiting.
      }
    };

    connectSocket();
    checkSessionReady();
    pollTimer = setInterval(checkSessionReady, 1500);

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (!transitioningRef.current) {
        socketRef.current?.disconnect();
        socketRef.current = null;
      }
    };
  }, [sessionId, role, router, updateState]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      {/* Waiting card */}
      <div className="bg-white border-[3px] border-[#1a1a1a] rounded-[20px] p-12 text-center w-[400px] shadow-[var(--shadow)]">
        <h2
          className="text-[1.6rem] text-[#7c3aed] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Session Created!
        </h2>
        <p className="text-[var(--text-muted)] text-[0.9rem] font-bold mb-4">
          Share this ID with your partner:
        </p>

        {/* Session ID display */}
        <div
          className="text-[2.5rem] font-[900] tracking-[0.3em] text-[#7c3aed] py-4 bg-[var(--surface2)] border-2 border-[#1a1a1a] rounded-[10px] my-4 shadow-[var(--shadow-sm)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {sessionId}
        </div>

        <div className="mt-3 text-left">
          <p className="text-[var(--text-muted)] text-[0.8rem] font-bold mb-2">Share this link</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareLink}
              className="flex-1 bg-white border-2 border-[#1a1a1a] rounded-[8px] px-3 py-2 text-[0.75rem] font-bold text-[var(--text)]"
            />
            <button
              onClick={copyShareLink}
              className="flex-none py-2 px-3 bg-[#7c3aed] text-white border-2 border-[#1a1a1a] rounded-[8px] font-[900] text-[0.78rem] shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-[transform] duration-100"
              style={{ fontFamily: "var(--font)" }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <p className="text-[var(--text-muted)] text-[0.85rem] mt-4 font-bold">
          You are the <strong className="text-[var(--text)]">{role}</strong>. Waiting for your partner to join...
        </p>
        <div className="spinner" />
      </div>
    </div>
  );
}

export default function WaitingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}>
      <WaitingContent />
    </Suspense>
  );
}
