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

const CampusCanvas = dynamic(() => import("@/components/campus/CampusCanvas"), { ssr: false });

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
  const [stageComplete, setStageComplete] = useState<{ stage: number; score: number } | null>(null);

  const socketRef = useRef<any>(state.socket);
  socketRef.current = state.socket;

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

  useEffect(() => {
    if (!AUTH.isLoggedIn()) { router.replace("/login"); return; }
    if (!state.sessionId || !state.role) { router.replace("/lobby"); return; }
    loadStage(state.currentStage);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const initSocket = async () => {
      if (!state.socket) {
        const { io } = await import("socket.io-client");
        const socket = io({ auth: { token: AUTH.getToken() } });
        socket.on("connect", () => {
          socket.emit("join_room", { sessionId: state.sessionId, playerName: state.playerName, role: state.role });
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
        setMessages((prev) => [...prev, { id: uid(), sender: playerName, message, isSystem: false }]);
      });
      socket.on("partner_status", ({ ready, allReady }: any) => {
        if (ready && !allReady) {
          setMessages((prev) => [...prev, { id: uid(), sender: "", message: "Your partner is ready! Finishing up...", isSystem: true }]);
        }
      });
      socket.on("stage_complete", ({ completedStage, nextStage, score }: any) => {
        updateState({ completedStages: completedStage, score, currentStage: nextStage });
        setShowWaiting(false);
        setStageComplete({ stage: completedStage, score });
      });
      socket.on("game_complete", ({ state: gameState }: any) => {
        setShowWaiting(false);
        updateState({ score: gameState.score, completedStages: 5 });
        router.push("/complete");
      });
      socket.on("player_disconnected", ({ playerName, role }: any) => {
        setMessages((prev) => [...prev, { id: uid(), sender: "", message: `⚠️ ${playerName} (${role}) disconnected.`, isSystem: true }]);
      });
    };

    if (state.sessionId) initSocket();
  }, [state.sessionId]); // eslint-disable-line

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
        body: JSON.stringify({ source_code: code, expected_output: task.expected_output }),
      });
      const data = await res.json();
      if (data.stderr) { setConsoleText(data.stderr); setConsoleError(true); }
      else { setConsoleText(data.stdout || "(no output)"); }
      const passed = task.expected_output === null ? data.status === "Accepted" : data.passed;
      if (passed) {
        setConsoleText((prev) => prev + "\n\n✅ Correct! Waiting for partner...");
        setShowWaiting(true);
        socketRef.current?.emit("task_complete", { sessionId: state.sessionId, role: state.role });
      } else if (!data.stderr) {
        setConsoleText((prev) => prev + "\n\n❌ Not quite right — try again!");
      }
    } catch {
      setConsoleText("Error: Could not reach code runner.");
      setConsoleError(true);
    } finally { setRunning(false); }
  };

  const sendChat = () => {
    const msg = chatInput.trim();
    if (!msg || !socketRef.current) return;
    socketRef.current.emit("chat_message", { sessionId: state.sessionId, playerName: state.playerName, message: msg });
    setChatInput("");
  };

  const handleNextLevel = () => { setStageComplete(null); loadStage(state.currentStage); };

  const stage = STAGES[state.currentStage - 1];
  const task = stage && state.role ? stage.tasks[state.role] : null;
  const progress = ((state.currentStage - 1) / 5) * 100;

  return (
    <>
      {showWaiting && <WaitingModal messages={messages} />}
      {stageComplete && (
        <StageCompleteModal completedStage={stageComplete.stage} score={stageComplete.score} onNext={handleNextLevel} />
      )}

      {/* ── Game Header ── */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#facc15] border-b-[3px] border-[#1a1a1a] flex-shrink-0">
        <span className="font-[900] text-[1.2rem] text-[#1a1a1a]" style={{ fontFamily: "var(--font-display)" }}>
          CodeCrafters 🏫
        </span>
        <div className="flex items-center gap-[0.6rem] text-[0.85rem] font-[800]">
          <span className="text-[0.75rem] py-[0.25rem] px-[0.75rem] bg-[#7c3aed] border-2 border-[#1a1a1a] rounded-[20px] text-white mr-3 font-[900] shadow-[var(--shadow-sm)]">
            {state.role}
          </span>
          <div className="w-[160px] h-[10px] bg-white border-2 border-[#1a1a1a] rounded-[20px] overflow-hidden">
            <div
              className="h-full bg-[#22c55e] rounded-[20px] transition-[width] duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>Stage {state.currentStage} / 5</span>
        </div>
        <span className="text-[0.95rem] text-[#1a1a1a] font-[900] bg-white border-2 border-[#1a1a1a] rounded-[8px] py-1 px-3 shadow-[var(--shadow-sm)]">
          Score: {state.score}
        </span>
      </header>

      {/* ── Game Main ── */}
      <main className="grid grid-cols-2 flex-1 overflow-hidden" style={{ height: "calc(100vh - 58px)" }}>

        {/* Code Panel */}
        <section className="flex flex-col overflow-hidden border-r-2 border-[#1a1a1a] p-4 gap-3 bg-[#fafafa]">
          {task && (
            <div className="bg-[#fff9e6] border-2 border-[#1a1a1a] rounded-[10px] p-[0.9rem_1rem] text-[0.85rem] flex-shrink-0 shadow-[var(--shadow-sm)]">
              <h3 className="text-[#7c3aed] mb-[0.35rem] text-[0.95rem] font-[900]">{task.title}</h3>
              <p className="text-[var(--text-muted)] mb-[0.4rem] font-bold">{task.description}</p>
              <ul className="pl-5 text-[var(--text)] font-bold">
                {task.steps.map((s, i) => (
                  <li key={i} className="mb-[0.2rem]">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Code editor */}
          <div className="flex-1 overflow-hidden">
            <textarea
              spellCheck={false}
              placeholder="# Write your Python here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const el = e.currentTarget;
                  const start = el.selectionStart;
                  const end = el.selectionEnd;
                  const newCode = code.substring(0, start) + "    " + code.substring(end);
                  setCode(newCode);
                  requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 4; });
                }
              }}
              className="w-full h-full bg-[#1e1b2e] text-[#a78bfa] border-2 border-[#1a1a1a] rounded-[10px] p-4 font-['Courier_New',monospace] text-[0.9rem] leading-[1.6] resize-none outline-none tab-[4]"
            />
          </div>

          {/* Console */}
          <div className="flex-shrink-0 h-[110px]">
            <div
              className={`h-full bg-[#1e1b2e] border-2 border-[#1a1a1a] rounded-[10px] px-4 py-3 text-[0.8rem] overflow-y-auto whitespace-pre-wrap font-['Courier_New',monospace] font-bold ${consoleError ? "text-[#ef4444]" : "text-[#22c55e]"}`}
            >
              {consoleText}
            </div>
          </div>

          <button
            disabled={running}
            onClick={handleRun}
            className="flex-none w-full mt-3 py-3 bg-[#22c55e] text-[#1a1a1a] border-2 border-[#1a1a1a] rounded-[10px] font-[900] text-[0.95rem] cursor-pointer shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-y-px active:shadow-[2px_2px_0_#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-[transform,box-shadow] duration-100"
            style={{ fontFamily: "var(--font)" }}
          >
            {running ? "⏳ Running..." : "▶ RUN CODE / SUBMIT"}
          </button>
        </section>

        {/* Campus + Chat Panel */}
        <section className="flex flex-col overflow-hidden border-r-2 border-[#1a1a1a]">
          {/* Campus canvas */}
          <div className="flex-1 bg-[#e0f2fe] flex items-stretch justify-stretch overflow-hidden border-b-2 border-[#1a1a1a]">
            <CampusCanvas completedStages={state.completedStages} style={{ width: "100%", height: "100%" }} />
          </div>

          {/* Chat */}
          <div className="flex-shrink-0 h-[200px] border-t-2 border-[#1a1a1a] flex flex-col bg-white">
            <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-[0.6rem] text-[0.8rem] flex flex-col gap-[0.3rem]">
              {messages.map((m) => (
                <div key={m.id} className="flex gap-2">
                  {!m.isSystem && <span className="text-[#7c3aed] font-[900]">{m.sender}:</span>}
                  <span className={`font-bold ${m.isSystem ? "text-[var(--text-muted)] italic" : "text-[var(--text)]"}`}>
                    {m.message}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 px-3 py-2 border-t-2 border-[#1a1a1a] flex-shrink-0 bg-[var(--surface2)]">
              <input
                type="text"
                placeholder="Type message..."
                maxLength={200}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                className="flex-1 bg-white/10 border border-white/20 rounded-[10px] px-4 py-[0.65rem] text-[var(--text)] font-bold text-[0.9rem] outline-none placeholder:text-[var(--text-muted)] focus:border-[#fbbf24] focus:shadow-[0_0_0_2px_rgba(251,191,36,0.2)] transition-all duration-150"
              />
              <button
                onClick={sendChat}
                className="flex-none py-[0.65rem] px-4 bg-[#7c3aed] text-white border-2 border-[#1a1a1a] rounded-[10px] font-[900] cursor-pointer shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-[transform,box-shadow] duration-100"
                style={{ fontFamily: "var(--font)" }}
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
