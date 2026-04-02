"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AUTH } from "@/lib/auth";
import { useGame } from "@/lib/game-context";
import { STAGES } from "@/lib/stages";
import { ChatMessage } from "@/types";
import dynamic from "next/dynamic";
import WaitingModal from "@/components/game/WaitingModal";
import StageCompleteModal from "@/components/game/StageCompleteModal";
import { SERVER_URL } from "../CONSTANT";

// Campus canvas is canvas-heavy — load client-only
const CampusCanvas = dynamic(() => import("@/components/campus/CampusCanvas"), {
  ssr: false,
});

let idCounter = 0;
const uid = () => String(++idCounter);

export default function GamePage() {
  const router = useRouter();
  const { state, updateState } = useGame();

  const [code, setCode] = useState("");
  const [consoleText, setConsoleText] = useState("Output will appear here...");
  const [consoleError, setConsoleError] = useState(false);
  const [running, setRunning] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const [showWaiting, setShowWaiting] = useState(false);
  const [stageComplete, setStageComplete] = useState<{
    stage: number;
    score: number;
  } | null>(null);

  const socketRef = useRef<any>(state.socket);
  socketRef.current = state.socket;

  // ── Load stage ────────────────────────────────────────────
  const loadStage = useCallback(
    (stageNumber: number) => {
      const stage = STAGES[stageNumber - 1];
      if (!stage || !state.role) return;
      const task = stage.tasks[state.role];
      setCode(task.starterCode);
      setConsoleText("Output will appear here...");
      setConsoleError(false);
    },
    [state.role],
  );

  // ── Guard + initial load ──────────────────────────────────
  useEffect(() => {
    if (!AUTH.isLoggedIn()) {
      router.replace("/login");
      return;
    }
    if (!state.sessionId || !state.role) {
      router.replace("/lobby");
      return;
    }
    loadStage(state.currentStage);
  }, []); // eslint-disable-line

  // ── Scroll chat to bottom ─────────────────────────────────
  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // ── Socket setup ──────────────────────────────────────────
  useEffect(() => {
    const initSocket = async () => {
      // If we don't have a socket yet (e.g. joining directly), create one
      if (!state.socket) {
        const { io } = await import("socket.io-client");
        const socket = io({ auth: { token: AUTH.getToken() } });
        socket.on("connect", () => {
          socket.emit("join_room", {
            sessionId: state.sessionId,
            playerName: state.playerName,
            role: state.role,
          });
        });
        updateState({ socket });
        socketRef.current = socket;
        attachListeners(socket);
      } else {
        attachListeners(state.socket);
      }
    };

    const attachListeners = (socket: any) => {
      socket.off("chat_message");
      socket.off("partner_status");
      socket.off("stage_complete");
      socket.off("game_complete");
      socket.off("player_disconnected");

      socket.on("chat_message", ({ playerName, message }: any) => {
        setMessages((prev) => [
          ...prev,
          { id: uid(), sender: playerName, message, isSystem: false },
        ]);
      });

      socket.on("partner_status", ({ ready, allReady }: any) => {
        if (ready && !allReady) {
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              sender: "",
              message: "Your partner is ready! Finishing up...",
              isSystem: true,
            },
          ]);
        }
      });

      socket.on(
        "stage_complete",
        ({ completedStage, nextStage, score }: any) => {
          updateState({
            completedStages: completedStage,
            score,
            currentStage: nextStage,
          });
          setShowWaiting(false);
          setStageComplete({ stage: completedStage, score });
        },
      );

      socket.on("game_complete", ({ state: gameState }: any) => {
        setShowWaiting(false);
        updateState({ score: gameState.score, completedStages: 5 });
        router.push("/complete");
      });

      socket.on("player_disconnected", ({ playerName, role }: any) => {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            sender: "",
            message: `⚠️ ${playerName} (${role}) disconnected.`,
            isSystem: true,
          },
        ]);
      });
    };

    if (state.sessionId) initSocket();
  }, [state.sessionId]); // eslint-disable-line

  // ── Run code ──────────────────────────────────────────────
  const handleRun = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setConsoleText("...");
    setConsoleError(false);

    try {
      const stage = STAGES[state.currentStage - 1];
      const task = stage.tasks[state.role!];
      const res = await fetch(`${SERVER_URL}/api/code/run`, {
        method: "POST",
        headers: AUTH.authHeaders(),
        body: JSON.stringify({
          source_code: code,
          expected_output: task.expected_output,
        }),
      });
      const data = await res.json();

      if (data.stderr) {
        setConsoleText(data.stderr);
        setConsoleError(true);
      } else {
        setConsoleText(data.stdout || "(no output)");
      }

      const passed =
        task.expected_output === null
          ? data.status === "Accepted"
          : data.passed;

      if (passed) {
        setConsoleText(
          (prev) => prev + "\n\n✅ Correct! Waiting for partner...",
        );
        setShowWaiting(true);
        socketRef.current?.emit("task_complete", {
          sessionId: state.sessionId,
          role: state.role,
        });
      } else if (!data.stderr) {
        setConsoleText((prev) => prev + "\n\n❌ Not quite right — try again!");
      }
    } catch {
      setConsoleText("Error: Could not reach code runner.");
      setConsoleError(true);
    } finally {
      setRunning(false);
    }
  };

  // ── Chat ──────────────────────────────────────────────────
  const sendChat = () => {
    const msg = chatInput.trim();
    if (!msg || !socketRef.current) return;
    socketRef.current.emit("chat_message", {
      sessionId: state.sessionId,
      playerName: state.playerName,
      message: msg,
    });
    setChatInput("");
  };

  // ── Stage complete → next level ───────────────────────────
  const handleNextLevel = () => {
    setStageComplete(null);
    loadStage(state.currentStage);
  };

  const stage = STAGES[state.currentStage - 1];
  const task = stage && state.role ? stage.tasks[state.role] : null;
  const progress = ((state.currentStage - 1) / 5) * 100;

  return (
    <>
      {/* ── Modals ────────────────────────────────────────── */}
      {showWaiting && <WaitingModal messages={messages} />}
      {stageComplete && (
        <StageCompleteModal
          completedStage={stageComplete.stage}
          score={stageComplete.score}
          onNext={handleNextLevel}
        />
      )}

      {/* ── Game Header ───────────────────────────────────── */}
      <header className="game-header">
        <span className="game-title">CodeCrafters 🏫</span>
        <div className="stage-info">
          <span className="role-badge">{state.role}</span>
          <div className="progress-bar-wrap">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <span>Stage {state.currentStage} / 5</span>
        </div>
        <span className="score">Score: {state.score}</span>
      </header>

      {/* ── Game Main ─────────────────────────────────────── */}
      <main className="game-main">
        {/* Code Panel */}
        <section className="panel panel-code">
          {task && (
            <div className="mission-brief">
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <ul>
                {task.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="editor-wrap">
            <textarea
              id="code-editor"
              spellCheck={false}
              placeholder="# Write your Python here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                // Tab key inserts 4 spaces
                if (e.key === "Tab") {
                  e.preventDefault();
                  const el = e.currentTarget;
                  const start = el.selectionStart;
                  const end = el.selectionEnd;
                  const newCode =
                    code.substring(0, start) + "    " + code.substring(end);
                  setCode(newCode);
                  requestAnimationFrame(() => {
                    el.selectionStart = el.selectionEnd = start + 4;
                  });
                }
              }}
            />
          </div>

          <div className="console-wrap">
            <div
              className={`console ${consoleError ? "error" : ""}`}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {consoleText}
            </div>
          </div>

          <button
            className="btn btn-run"
            disabled={running}
            onClick={handleRun}
          >
            {running ? "⏳ Running..." : "▶ RUN CODE / SUBMIT"}
          </button>
        </section>

        {/* Campus + Chat Panel */}
        <section className="panel panel-campus">
          <div className="campus-wrap">
            <CampusCanvas
              completedStages={state.completedStages}
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          <div className="chat-wrap">
            <div className="chat-messages" ref={chatRef}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-msg ${m.isSystem ? "system" : ""}`}
                >
                  {!m.isSystem && <span className="sender">{m.sender}:</span>}
                  <span className="text">{m.message}</span>
                </div>
              ))}
            </div>
            <div className="chat-input-row">
              <input
                type="text"
                placeholder="Type message..."
                maxLength={200}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
              />
              <button className="btn btn-send" onClick={sendChat}>
                Send
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
