"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AUTH } from "@/lib/auth";
import { useGame } from "@/lib/game-context";
import { STAGES } from "@/lib/stages";
import { ChatMessage, Task } from "@/types";
import dynamic from "next/dynamic";
import WaitingModal from "@/components/game/WaitingModal";
import StageCompleteModal from "@/components/game/StageCompleteModal";
import { SERVER_URL } from "../CONSTANT";
import {
  Layers, Hammer, Bot, Sparkles, Play, Loader2,
  Send, AlertTriangle, X, LogOut, Volume2, VolumeX,
  BookOpen, GraduationCap, Utensils, FlaskConical, Activity,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { SFX } from "@/lib/sfx";
import { Music } from "@/lib/music";

const CampusCanvas = dynamic(() => import("@/components/campus/CampusCanvas"), { ssr: false });

let idCounter = 0;
const uid = () => String(++idCounter);

function staticTask(stageNumber: number, level: 1 | 2 | 3, role: "Architect" | "Builder"): Task | null {
  const stage = STAGES[stageNumber - 1];
  if (!stage) return null;
  const tasks = stage.levels[level]?.[role];
  if (!tasks?.length) return null;
  return tasks[Math.floor(Math.random() * tasks.length)];
}

const ROLE_INFO = {
  Architect: { color: "#fbbf24", bg: "#fbbf24", textColor: "#1a1a1a", Icon: Layers, desc: "You design the blueprint" },
  Builder:   { color: "#a78bfa", bg: "#7c3aed", textColor: "#fff",    Icon: Hammer, desc: "You write the code" },
};

const STAGE_BUILDINGS: { name: string; Icon: LucideIcon }[] = [
  { name: "Library",     Icon: BookOpen },
  { name: "Classroom",   Icon: GraduationCap },
  { name: "Cafeteria",   Icon: Utensils },
  { name: "Science Lab", Icon: FlaskConical },
  { name: "Playground",  Icon: Activity },
];

export default function GamePage() {
  const router = useRouter();
  const { state, updateState } = useGame();

  const [code, setCode] = useState("");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [consoleText, setConsoleText] = useState("Output will appear here...");
  const [consoleError, setConsoleError] = useState(false);
  const [consolePassed, setConsolePassed] = useState(false);
  const [running, setRunning] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const [showWaiting, setShowWaiting] = useState(false);
  const [stageComplete, setStageComplete] = useState<{ stage: number; score: number; nextStage: number } | null>(null);
  const [partnerDisconnected, setPartnerDisconnected] = useState(false);
  const [partnerFinishedBanner, setPartnerFinishedBanner] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  useEffect(() => { setMuted(SFX.isMuted()); }, []);

  const socketRef = useRef<any>(state.socket);
  socketRef.current = state.socket;
  const loadGenRef = useRef(0);

  const loadStage = useCallback(async (stageNumber: number) => {
    if (!state.role) return;
    const gen = ++loadGenRef.current;
    setTaskLoading(true);
    setCurrentTask(null);
    setCode("");
    setConsoleText("Output will appear here...");
    setConsoleError(false);
    setConsolePassed(false);

    let task: Task | null = null;
    try {
      const res = await fetch(`${SERVER_URL}/api/task/generate`, {
        method: "POST",
        headers: AUTH.authHeaders(),
        body: JSON.stringify({ stage: stageNumber, level: state.level, role: state.role }),
      });
      const data = await res.json();
      if (res.ok && !data.fallback) task = data as Task;
    } catch { /* fall through */ }

    if (gen !== loadGenRef.current) return;
    if (!task) task = staticTask(stageNumber, state.level, state.role);
    if (task) { setCurrentTask(task); setCode(task.starterCode); }
    setTaskLoading(false);
  }, [state.role, state.level]);

  useEffect(() => {
    if (!AUTH.isLoggedIn()) { router.replace("/login"); return; }
    if (!state.sessionId || !state.role) { router.replace("/lobby"); return; }
    loadStage(state.currentStage);
    Music.play("coding");
    return () => { Music.stop(); };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    let activeSocket: any = null;
    let createdSocket: any = null;

    const initSocket = async () => {
      if (!state.socket) {
        const { io } = await import("socket.io-client");
        const socket = io(SERVER_URL, { auth: { token: AUTH.getToken() } });
        activeSocket = socket;
        createdSocket = socket;
        socket.on("connect", () => {
          socket.emit("join_room", { sessionId: state.sessionId, playerName: state.playerName, role: state.role });
        });
        updateState({ socket });
        socketRef.current = socket;
        attachListeners(socket);
      } else {
        activeSocket = state.socket;
        attachListeners(state.socket);
      }
    };

    const attachListeners = (socket: any) => {
      socket.off("chat_message");
      socket.off("partner_status");
      socket.off("stage_complete");
      socket.off("game_complete");
      socket.off("player_disconnected");

      socket.on("chat_message", ({ playerName, message, role }: any) => {
        setMessages((prev) => [...prev, { id: uid(), sender: playerName, role, message, isSystem: false }]);
      });
      socket.on("partner_status", ({ ready, allReady }: any) => {
        if (ready && !allReady) {
          Music.setState("pressure");
          if (state.isAI) {
            setMessages((prev) => [...prev, { id: uid(), sender: "", message: "Your partner finished — hang tight!", isSystem: true }]);
          } else {
            setPartnerFinishedBanner(true);
          }
        }
      });
      socket.on("stage_complete", ({ completedStage, nextStage, score }: any) => {
        SFX.stageComplete();
        updateState({ completedStages: completedStage, score, currentStage: nextStage });
        setShowWaiting(false);
        setStageComplete({ stage: completedStage, score, nextStage });
      });
      socket.on("game_complete", ({ state: gameState }: any) => {
        SFX.gameComplete();
        setShowWaiting(false);
        updateState({ score: gameState.score, completedStages: 5 });
        router.push("/complete");
      });
      socket.on("player_disconnected", ({ playerName, role }: any) => {
        setMessages((prev) => [...prev, { id: uid(), sender: "", message: `${playerName} (${role}) disconnected.`, isSystem: true }]);
        if (!state.isAI) setPartnerDisconnected(true);
      });
    };

    if (state.sessionId) initSocket();

    return () => {
      const socket = activeSocket || socketRef.current;
      if (!socket) return;
      socket.off("chat_message");
      socket.off("partner_status");
      socket.off("stage_complete");
      socket.off("game_complete");
      socket.off("player_disconnected");
      if (createdSocket && socket === createdSocket) {
        socket.disconnect();
        if (socketRef.current === socket) { socketRef.current = null; updateState({ socket: null }); }
      }
    };
  }, [state.sessionId]); // eslint-disable-line

  const handleRun = async () => {
    if (!code.trim() || !currentTask) return;
    setRunning(true);
    setConsoleText("Running...");
    setConsoleError(false);
    setConsolePassed(false);
    try {
      const task = currentTask;
      const res = await fetch(`${SERVER_URL}/api/code/run`, {
        method: "POST",
        headers: AUTH.authHeaders(),
        body: JSON.stringify({ source_code: code, expected_output: task.expected_output }),
      });
      const data = await res.json();
      if (data.stderr) {
        setConsoleText(data.stderr);
        setConsoleError(true);
        SFX.error();
      } else {
        setConsoleText(data.stdout || "(no output)");
      }
      const passed = task.expected_output === null ? data.status === "Accepted" : data.passed;
      if (passed) {
        SFX.correct();
        setConsolePassed(true);
        setConsoleText((prev) => prev + "\n\nCorrect! Waiting for your partner...");
        setShowWaiting(true);
        socketRef.current?.emit("task_complete", { sessionId: state.sessionId, role: state.role });
      } else if (!data.stderr) {
        SFX.wrong();
        setConsoleText((prev) => prev + "\n\nNot quite — check your output and try again!");
      }
    } catch {
      SFX.error();
      setConsoleText("Error: Could not reach code runner.");
      setConsoleError(true);
    } finally { setRunning(false); }
  };

  const sendChat = () => {
    const msg = chatInput.trim();
    if (!msg || !socketRef.current) return;
    socketRef.current.emit("chat_message", { sessionId: state.sessionId, playerName: state.playerName, message: msg, task: currentTask });
    setChatInput("");
  };

  const handleNextLevel = () => {
    const next = stageComplete?.nextStage ?? state.currentStage;
    setStageComplete(null);
    setPartnerFinishedBanner(false);
    Music.setState("coding");
    loadStage(next);
  };

  const handleLeave = async () => {
    if (!confirm("Leave this game? Your session will be saved — you can rejoin from the dashboard.")) return;
    setLeaveLoading(true);
    try {
      await fetch(`${SERVER_URL}/api/game/abandon`, { method: "POST", headers: AUTH.authHeaders() });
    } catch { /* ignore */ }
    socketRef.current?.disconnect();
    updateState({ socket: null });
    router.replace("/dashboard");
  };

  const progress = ((state.currentStage - 1) / 5) * 100;
  const roleInfo = state.role ? ROLE_INFO[state.role] : ROLE_INFO["Builder"];
  const stageBuilding = STAGE_BUILDINGS[state.currentStage - 1] ?? { name: "Building", Icon: BookOpen };
  const levelLabel = state.level === 1 ? "Foundation" : state.level === 2 ? "Walls" : "Roof";
  const levelColor = state.level === 1 ? "#22c55e" : state.level === 2 ? "#f59e0b" : "#ec4899";

  return (
    <>
      {showWaiting && <WaitingModal messages={messages} />}
      {stageComplete && (
        <StageCompleteModal completedStage={stageComplete.stage} score={stageComplete.score} onNext={handleNextLevel} />
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-[#facc15] border-b-[3px] border-[#1a1a1a] flex-shrink-0">
        <span className="font-black text-[1.15rem] text-[#1a1a1a]" style={{ fontFamily: "var(--font-display)" }}>
          CodeCrafters
        </span>

        <div className="flex items-center gap-3">
          {/* Role badge */}
          <span
            className="flex items-center gap-1.5 text-[11px] py-1 px-3 border-2 border-[#1a1a1a] rounded-full font-black shadow-[var(--shadow-sm)]"
            style={{ background: roleInfo.bg, color: roleInfo.textColor }}
          >
            <roleInfo.Icon size={12} />
            {state.role}
          </span>

          {/* Building name */}
          <span className="hidden sm:flex items-center gap-1.5 text-[12px] font-black text-[#1a1a1a]">
            <stageBuilding.Icon size={13} />
            Stage {state.currentStage}: {stageBuilding.name}
          </span>

          {/* Level badge */}
          <span
            className="text-[10px] py-0.5 px-2.5 rounded-full font-black border-2 border-[#1a1a1a]"
            style={{ background: levelColor, color: "#000" }}
          >
            {levelLabel}
          </span>

          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="w-[120px] h-[9px] bg-white border-2 border-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#22c55e] rounded-full transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] font-black text-[#1a1a1a]">{state.currentStage}/5</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[0.9rem] text-[#1a1a1a] font-black bg-white border-2 border-[#1a1a1a] rounded-lg py-1 px-3 shadow-[var(--shadow-sm)]">
            <Sparkles size={13} />
            {state.score} XP
          </span>
          <button
            onClick={() => {
              const next = SFX.toggleMute(); // writes shared sound_muted key
              Music.setMuted(next);
              setMuted(next);
            }}
            title={muted ? "Unmute sound" : "Mute sound"}
            className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1.5 bg-[#1a1a1a]/10 border border-[#1a1a1a]/30 rounded-lg text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/20 hover:text-[#1a1a1a] transition-all"
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
          <button
            onClick={handleLeave}
            disabled={leaveLoading}
            className="flex items-center gap-1 text-[11px] font-black px-3 py-1.5 bg-[#1a1a1a]/10 border border-[#1a1a1a]/30 rounded-lg text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/20 hover:text-[#1a1a1a] transition-all disabled:opacity-40"
          >
            <LogOut size={12} />
            {leaveLoading ? "..." : "Leave"}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="grid grid-cols-2 flex-1 overflow-hidden" style={{ height: "calc(100vh - 54px)" }}>

        {/* Left: Code Panel */}
        <section className="flex flex-col overflow-hidden border-r-2 border-[#1a1a1a] bg-[#f8f7ff]">

          {/* Task card */}
          <div className="flex-shrink-0 border-b-2 border-[#1a1a1a]">
            {taskLoading ? (
              <div className="bg-[#fff9e6] p-4 animate-pulse space-y-2">
                <div className="h-4 bg-[#e9d8a0] rounded w-2/3" />
                <div className="h-3 bg-[#e9d8a0] rounded w-full" />
                <div className="h-3 bg-[#e9d8a0] rounded w-5/6" />
                <p className="flex items-center gap-1.5 text-[11px] text-[#a0856a] font-bold pt-1">
                  <Sparkles size={11} /> AI is generating your challenge...
                </p>
              </div>
            ) : currentTask ? (
              <div className="bg-[#fff9e6] p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-[#7c3aed] text-[0.9rem] font-black leading-tight">{currentTask.title}</h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-full border border-[#1a1a1a]"
                      style={{ background: levelColor, color: "#000" }}
                    >
                      {levelLabel}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-[#a0856a] bg-[#fef3c7] border border-[#fbbf24] px-2 py-0.5 rounded-full">
                      <Sparkles size={9} /> AI
                    </span>
                  </div>
                </div>
                <p className="text-[#78716c] text-[0.8rem] font-bold mb-2">{currentTask.description}</p>
                <ol className="space-y-1 pl-1">
                  {currentTask.steps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-[0.78rem] font-bold text-[#1a1a1a]">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7c3aed] text-white text-[10px] font-black flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="leading-snug">{s}</span>
                    </li>
                  ))}
                </ol>
                {currentTask.expected_output !== null && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-[#22c55e]/40">
                    <div className="px-2.5 py-1 bg-[#22c55e]/15 border-b border-[#22c55e]/30">
                      <span className="text-[9px] font-black tracking-wider text-[#15803d]">EXPECTED OUTPUT</span>
                    </div>
                    <pre className="px-3 py-2 text-[0.75rem] font-['Courier_New',monospace] font-bold text-[#15803d] bg-[#f0fdf4] leading-relaxed whitespace-pre-wrap">
                      {currentTask.expected_output}
                    </pre>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Editor label */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#1e1b2e] border-b border-white/10 flex-shrink-0">
            <span className="text-[10px] font-black text-white/50 tracking-wider">PYTHON EDITOR</span>
            <span className="text-[10px] text-white/30 font-bold">Tab = 4 spaces</span>
          </div>

          {/* Code editor */}
          <div className="flex-1 overflow-hidden">
            <textarea
              spellCheck={false}
              placeholder="# Write your Python code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={taskLoading}
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
              className="w-full h-full bg-[#1e1b2e] text-[#a78bfa] p-4 font-['Courier_New',monospace] text-[0.875rem] leading-[1.65] resize-none outline-none disabled:opacity-40 placeholder:text-white/20"
            />
          </div>

          {/* Console label */}
          <div className="flex items-center justify-between px-4 py-1.5 border-t-2 border-[#1a1a1a] bg-[#1e1b2e] flex-shrink-0">
            <span className="text-[10px] font-black text-white/50 tracking-wider">OUTPUT CONSOLE</span>
            {consolePassed && (
              <span className="flex items-center gap-1 text-[10px] font-black text-[#22c55e] animate-pulse">
                <CheckCircle2 size={11} /> PASSED
              </span>
            )}
            {consoleError && (
              <span className="flex items-center gap-1 text-[10px] font-black text-[#ef4444]">
                <AlertTriangle size={11} /> ERROR
              </span>
            )}
          </div>

          {/* Console output */}
          <div className="flex-shrink-0 h-[100px]">
            <div
              className={`h-full bg-[#0d0b1e] px-4 py-3 text-[0.78rem] overflow-y-auto whitespace-pre-wrap font-['Courier_New',monospace] font-bold leading-relaxed ${
                consoleError ? "text-[#ef4444]" : consolePassed ? "text-[#22c55e]" : "text-[#a78bfa]"
              }`}
            >
              {consoleText}
            </div>
          </div>

          {/* Run button */}
          <button
            disabled={running || taskLoading || !currentTask}
            onClick={handleRun}
            className="flex-none flex items-center justify-center gap-2 w-full py-3.5 bg-[#22c55e] text-[#1a1a1a] border-t-2 border-[#1a1a1a] font-black text-[0.95rem] cursor-pointer hover:bg-[#16a34a] hover:-translate-y-0.5 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-100"
          >
            {running
              ? <><Loader2 size={16} className="animate-spin" /> Running your code...</>
              : taskLoading
              ? <><Loader2 size={16} className="animate-spin" /> Loading challenge...</>
              : <><Play size={16} /> Run &amp; Submit</>}
          </button>
        </section>

        {/* Right: Campus + Chat */}
        <section className="flex flex-col overflow-hidden bg-white">

          {/* Partner disconnect banner */}
          {partnerDisconnected && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#fef3c7] border-b-2 border-[#f59e0b] flex-shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#92400e] flex-shrink-0" />
                <div>
                  <p className="text-[12px] font-black text-[#92400e]">Your partner disconnected</p>
                  <p className="text-[11px] font-bold text-[#a16207]">They can rejoin from their dashboard.</p>
                </div>
              </div>
              <button
                onClick={() => setPartnerDisconnected(false)}
                className="text-[#92400e]/60 hover:text-[#92400e] transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Campus canvas */}
          <div className="flex-1 bg-[#e0f2fe] flex items-stretch justify-stretch overflow-hidden border-b-2 border-[#1a1a1a] relative">
            <CampusCanvas completedStages={state.completedStages} style={{ width: "100%", height: "100%" }} />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 border-2 border-[#1a1a1a] rounded-xl px-3 py-1.5 text-[11px] font-black text-[#1a1a1a] shadow-[var(--shadow-sm)]">
              <stageBuilding.Icon size={12} />
              {stageBuilding.name}
            </div>
            {/* Multiplayer: partner finished banner (overlay on canvas) */}
            {!state.isAI && partnerFinishedBanner && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#f59e0b] shadow-lg"
                style={{ background: "rgba(254,243,199,0.97)" }}>
                <span className="text-lg">⏳</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-[#92400e]">Your partner finished!</p>
                  <p className="text-[11px] font-bold text-[#a16207]">Hurry up — they're waiting for you.</p>
                </div>
                <button onClick={() => setPartnerFinishedBanner(false)} className="text-[#92400e]/50 hover:text-[#92400e] transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Chat panel — AI Study Buddy for AI mode, Partner Chat for two-player */}
          <div className="flex-shrink-0 h-[290px] border-t-2 border-[#1a1a1a] flex flex-col bg-white">
            {/* Chat header */}
            {state.isAI ? (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-[#e5e7eb] bg-[#f8f7ff] flex-shrink-0">
                <Bot size={15} className="text-[#7c3aed]" />
                <span className="text-[12px] font-black text-[#7c3aed]">AI Study Buddy</span>
                <span className="text-[10px] text-[#78716c] font-bold">· Ask anything about your task</span>
                <div className="ml-auto w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-[#e5e7eb] bg-[#f0fdf4] flex-shrink-0">
                <Send size={15} className="text-[#16a34a]" />
                <span className="text-[12px] font-black text-[#16a34a]">Partner Chat</span>
                <span className="text-[10px] text-[#78716c] font-bold">· Collaborate with your partner</span>
                <div className="ml-auto w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              </div>
            )}

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5 text-[0.78rem]">
              {messages.length === 0 && (
                <p className="flex items-center gap-1.5 text-[0.74rem] text-[#78716c] italic font-bold mt-1">
                  {state.isAI ? (
                    <><Bot size={12} className="flex-shrink-0" />Stuck? Type a question and hit Send — your AI tutor is ready!</>
                  ) : (
                    <><Send size={12} className="flex-shrink-0" />Use this chat to collaborate with your partner!</>
                  )}
                </p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-1.5 min-w-0 ${m.isSystem ? "opacity-70" : ""}`}>
                  {!m.isSystem && (
                    <span
                      className="font-black flex-shrink-0"
                      style={{ color: m.role === "Architect" ? "#f59e0b" : "#7c3aed" }}
                    >
                      {m.sender}{m.role ? ` (${m.role})` : ""}:
                    </span>
                  )}
                  <span className={`font-bold min-w-0 break-words leading-snug ${m.isSystem ? "text-[#78716c] italic" : "text-[#1a1a1a]"}`}>
                    {m.message}
                  </span>
                </div>
              ))}
            </div>

            {/* Chat input */}
            <div className="flex gap-2 px-3 py-2 border-t border-[#e5e7eb] bg-[#f9fafb] flex-shrink-0">
              <input
                type="text"
                placeholder={state.isAI ? "Ask a hint, e.g. 'how do I use a for loop?'" : "Message your partner..."}
                maxLength={200}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                className="flex-1 bg-white border-2 border-[#e5e7eb] rounded-xl px-3 py-2 text-[0.82rem] font-bold text-[#1a1a1a] outline-none placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:shadow-[0_0_0_2px_rgba(124,58,237,0.12)] transition-all"
              />
              <button
                onClick={sendChat}
                className="flex-none flex items-center gap-1.5 py-2 px-4 bg-[#7c3aed] text-white border-2 border-[#1a1a1a] rounded-xl font-black text-[0.82rem] cursor-pointer shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-all duration-100"
              >
                <Send size={13} />
                Send
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
