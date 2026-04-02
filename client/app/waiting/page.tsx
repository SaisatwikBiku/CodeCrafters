"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH } from "@/lib/auth";
import { useGame } from "@/lib/game-context";

function WaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, updateState } = useGame();

  const sessionId = searchParams.get("sessionId") || state.sessionId || "------";
  const role = searchParams.get("role") || state.role || "Architect";

  useEffect(() => {
    if (!AUTH.isLoggedIn()) { router.replace("/login"); return; }
    if (!sessionId || sessionId === "------") { router.replace("/lobby"); return; }

    let socket: any;
    const connectSocket = async () => {
      const { io } = await import("socket.io-client");
      socket = io({ auth: { token: AUTH.getToken() } });

      socket.on("connect", () => {
        socket.emit("join_room", { sessionId, playerName: AUTH.getUsername(), role });
      });

      socket.on("player_joined", ({ playerName, role: joinedRole, state: gameState }: any) => {
        if (gameState?.players?.Architect && gameState?.players?.Builder) {
          updateState({
            socket,
            sessionId: gameState.sessionId || sessionId,
            playerName: AUTH.getUsername(),
            role: role as any,
            currentStage: gameState.stage,
            score: gameState.score,
            completedStages: gameState.stage - 1,
          });
          router.push("/game");
        }
      });

      socket.on("error", ({ message }: any) => { alert("Server error: " + message); });
    };

    connectSocket();
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
