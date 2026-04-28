import { SERVER_URL } from "@/app/CONSTANT";
import { AUTH } from "@/lib/auth";
import { useGame } from "@/lib/game-context";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Users, Bot, Layers, Building2, Home, Hammer,
  BookOpen, GraduationCap, Utensils, FlaskConical, Activity,
  Rocket, Loader2, X, Check, Link2, LogIn,
  type LucideIcon,
} from "lucide-react";

const ROLES: {
  id: "Architect" | "Builder";
  name: string;
  Icon: LucideIcon;
  tagline: string;
  desc: string;
  color: string;
  bg: string;
}[] = [
  {
    id: "Architect",
    name: "Architect",
    Icon: Layers,
    tagline: "Design the Blueprint",
    desc: "You decide WHAT to build — name variables, define structure, and set the plan.",
    color: "#fbbf24",
    bg: "linear-gradient(135deg, #3d2e00 0%, #1c1500 100%)",
  },
  {
    id: "Builder",
    name: "Builder",
    Icon: Hammer,
    tagline: "Write the Code",
    desc: "You decide HOW to build it — write Python code that brings the Architect's plan to life.",
    color: "#a78bfa",
    bg: "linear-gradient(135deg, #2d1b6b 0%, #130d30 100%)",
  },
];

const LEVELS: {
  id: number;
  badge: string;
  name: string;
  Icon: LucideIcon;
  desc: string;
  skills: string[];
  borderColor: string;
  badgeColor: string;
}[] = [
  {
    id: 1, badge: "Level 1", name: "Foundation", Icon: Layers,
    desc: "Print, variables & data types — the basics.",
    skills: ["print()", "input()", "Variables", "Data types"],
    borderColor: "#22c55e", badgeColor: "#22c55e",
  },
  {
    id: 2, badge: "Level 2", name: "Walls", Icon: Building2,
    desc: "Logic & loops — make your code think.",
    skills: ["if / else", "for loops", "while loops", "Lists"],
    borderColor: "#f59e0b", badgeColor: "#f59e0b",
  },
  {
    id: 3, badge: "Level 3", name: "Roof", Icon: Home,
    desc: "Functions — write reusable, clean code.",
    skills: ["def", "Parameters", "return", "Scope"],
    borderColor: "#ec4899", badgeColor: "#ec4899",
  },
];

const BUILDINGS: { id: string; name: string; Icon: LucideIcon }[] = [
  { id: "library",     name: "Library",     Icon: BookOpen },
  { id: "classroom",   name: "Classroom",   Icon: GraduationCap },
  { id: "cafeteria",   name: "Cafeteria",   Icon: Utensils },
  { id: "science-lab", name: "Science Lab", Icon: FlaskConical },
  { id: "playground",  name: "Playground",  Icon: Activity },
];

export default function StartGameModal({
  isModalOpen,
  handleModal,
  preselectedBuilding,
}: {
  isModalOpen: boolean;
  handleModal: Dispatch<SetStateAction<boolean>>;
  preselectedBuilding: string;
}) {
  const router = useRouter();
  const { updateState } = useGame();

  const [playMode, setPlayMode] = useState<"friend" | "ai" | "">("");
  const [friendMode, setFriendMode] = useState<"create" | "join" | "">("");
  const [joinCode, setJoinCode] = useState("");
  const [selectedRole, setSelectedRole] = useState<"Architect" | "Builder" | "">("");
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [loading, setLoading] = useState(false);

  const isJoining  = playMode === "friend" && friendMode === "join";
  const isCreating = playMode === "ai" || (playMode === "friend" && friendMode === "create");
  const canStart   = isJoining
    ? joinCode.trim().length >= 6
    : isCreating && selectedRole !== "" && selectedLevel !== 0;

  const selectedBuildingData = BUILDINGS.find((b) => b.id === preselectedBuilding);

  const handleClose = () => {
    setPlayMode(""); setFriendMode(""); setJoinCode("");
    setSelectedRole(""); setSelectedLevel(0);
    handleModal(false);
  };

  const handleJoinRoom = async () => {
    const id = joinCode.trim().toUpperCase();
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/game/join`, {
        method: "POST",
        headers: AUTH.authHeaders(),
        body: JSON.stringify({ sessionId: id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Could not join session."); return; }
      updateState({
        playerName: AUTH.getUsername(),
        sessionId: data.sessionId,
        role: data.role,
        currentStage: data.stage,
        level: (data.level ?? 1) as 1 | 2 | 3,
        completedStages: Math.max(0, (data.stage ?? 1) - 1),
        isAI: false,
      });
      router.push("/game");
    } catch {
      alert("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartBuilding = async () => {
    if (!canStart) return;
    if (isJoining) { await handleJoinRoom(); return; }
    setLoading(true);
    try {
      const startStage = Math.max(1, BUILDINGS.findIndex((b) => b.id === preselectedBuilding) + 1);
      const endpoint = playMode === "ai" ? "/api/game/create-ai" : "/api/game/create";
      const res = await fetch(`${SERVER_URL}${endpoint}`, {
        method: "POST",
        headers: AUTH.authHeaders(),
        body: JSON.stringify({ startStage, level: selectedLevel, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Could not create session."); return; }
      updateState({
        playerName: AUTH.getUsername(),
        sessionId: data.sessionId,
        role: data.role,
        currentStage: data.stage ?? startStage,
        level: (data.level ?? selectedLevel) as 1 | 2 | 3,
        completedStages: (data.stage ?? startStage) - 1,
        isAI: playMode === "ai",
      });
      router.push(playMode === "ai" ? "/game" : `/waiting?sessionId=${data.sessionId}&role=${data.role}`);
    } catch {
      alert("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, []); // eslint-disable-line

  if (!isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-50 bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-11/12 max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl text-white anim-pop"
        style={{
          background: "linear-gradient(160deg, #1a1040 0%, #0d0b1e 100%)",
          border: "1.5px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-white/8">
          <div>
            <h2 className="text-xl font-black">Start Building</h2>
            {selectedBuildingData && (
              <div className="flex items-center gap-1.5 text-white/45 text-[13px] font-bold mt-0.5">
                <selectedBuildingData.Icon size={13} />
                {selectedBuildingData.name}
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 text-white/50 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-7 py-6 space-y-7">

          {/* Play Mode */}
          <div>
            <h3 className="text-[11px] font-black tracking-widest text-white/40 mb-3">HOW DO YOU WANT TO PLAY?</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setPlayMode("friend"); setFriendMode(""); }}
                className="rounded-2xl border-2 cursor-pointer p-5 text-left transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #3b1d8e 0%, #1e1255 100%)",
                  borderColor: playMode === "friend" ? "#7c6ff7" : "transparent",
                  boxShadow: playMode === "friend" ? "0 0 0 1px #7c6ff7, 0 4px 20px rgba(124,111,247,0.3)" : "none",
                }}
              >
                <Users size={28} className="mb-2 text-white/70" />
                <div className="font-black text-[15px] mb-1">Play with a Friend</div>
                <p className="text-white/50 text-[12px] leading-snug">
                  Create a room or join one with a code — play together in real time.
                </p>
                {playMode === "friend" && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#7c6ff7] text-white">
                    <Check size={10} /> Selected
                  </div>
                )}
              </button>

              <button
                onClick={() => setPlayMode("ai")}
                className="rounded-2xl border-2 cursor-pointer p-5 text-left transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #0d4a28 0%, #071a10 100%)",
                  borderColor: playMode === "ai" ? "#22c55e" : "transparent",
                  boxShadow: playMode === "ai" ? "0 0 0 1px #22c55e, 0 4px 20px rgba(34,197,94,0.2)" : "none",
                }}
              >
                <Bot size={28} className="mb-2 text-white/70" />
                <div className="font-black text-[15px] mb-1">Play with AI</div>
                <p className="text-white/50 text-[12px] leading-snug">
                  No partner needed — the AI plays alongside you anytime, day or night.
                </p>
                {playMode === "ai" && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#22c55e] text-black">
                    <Check size={10} /> Selected
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Friend sub-mode: Create vs Join */}
          {playMode === "friend" && (
            <div>
              <h3 className="text-[11px] font-black tracking-widest text-white/40 mb-3">CREATE OR JOIN?</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFriendMode("create")}
                  className="rounded-2xl border-2 cursor-pointer p-4 text-left transition-all hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #1e3a5f 0%, #0f1f35 100%)",
                    borderColor: friendMode === "create" ? "#60a5fa" : "transparent",
                    boxShadow: friendMode === "create" ? "0 0 0 1px #60a5fa, 0 4px 20px rgba(96,165,250,0.25)" : "none",
                  }}
                >
                  <Link2 size={22} className="mb-2 text-white/70" />
                  <div className="font-black text-[14px] mb-0.5">Create a Room</div>
                  <p className="text-white/45 text-[11px] leading-snug">Pick your role and level, then share the code with a friend.</p>
                  {friendMode === "create" && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#60a5fa] text-[#0f172a]">
                      <Check size={10} /> Selected
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setFriendMode("join")}
                  className="rounded-2xl border-2 cursor-pointer p-4 text-left transition-all hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #1a3a2a 0%, #0d1f15 100%)",
                    borderColor: friendMode === "join" ? "#4ade80" : "transparent",
                    boxShadow: friendMode === "join" ? "0 0 0 1px #4ade80, 0 4px 20px rgba(74,222,128,0.2)" : "none",
                  }}
                >
                  <LogIn size={22} className="mb-2 text-white/70" />
                  <div className="font-black text-[14px] mb-0.5">Join a Room</div>
                  <p className="text-white/45 text-[11px] leading-snug">Enter the 8-character code your friend shared with you.</p>
                  {friendMode === "join" && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#4ade80] text-[#0d1f15]">
                      <Check size={10} /> Selected
                    </div>
                  )}
                </button>
              </div>

              {/* Join code input */}
              {friendMode === "join" && (
                <div className="mt-4">
                  <p className="text-[11px] text-white/40 font-bold mb-2">Enter the session code:</p>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="e.g. AB3F9X2K"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    onKeyDown={(e) => { if (e.key === "Enter" && canStart) handleStartBuilding(); }}
                    className="w-full bg-white/8 border-2 border-white/15 rounded-xl px-4 py-3 text-white font-black text-[1.1rem] tracking-[0.25em] text-center outline-none placeholder:text-white/20 placeholder:tracking-normal focus:border-[#4ade80] focus:bg-white/12 transition-all"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* Role Selection — shown for create flow only */}
          {!isJoining && (
          <div>
            <h3 className="text-[11px] font-black tracking-widest text-white/40 mb-1">CHOOSE YOUR ROLE</h3>
            <p className="text-[11px] text-white/30 font-bold mb-3">
              {playMode === "ai"
                ? "The AI will take the other role."
                : "Your partner will be assigned the other role."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                const RoleIcon = role.Icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className="rounded-2xl border-2 cursor-pointer p-5 text-left transition-all hover:scale-[1.02]"
                    style={{
                      background: role.bg,
                      borderColor: isSelected ? role.color : "transparent",
                      boxShadow: isSelected ? `0 0 0 1px ${role.color}, 0 4px 20px ${role.color}33` : "none",
                    }}
                  >
                    <RoleIcon size={28} className="mb-2" style={{ color: role.color }} />
                    <div className="font-black text-[15px] mb-0.5">{role.name}</div>
                    <div className="text-[11px] font-black mb-1" style={{ color: role.color }}>{role.tagline}</div>
                    <p className="text-white/50 text-[12px] leading-snug">{role.desc}</p>
                    {isSelected && (
                      <div
                        className="mt-2 inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border border-[#1a1a1a]"
                        style={{ background: role.color, color: role.id === "Architect" ? "#1a1a1a" : "#ffffff" }}
                      >
                        <Check size={10} /> Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* Level — shown for create flow only */}
          {!isJoining && (
          <div>
            <h3 className="text-[11px] font-black tracking-widest text-white/40 mb-3">CHOOSE YOUR DIFFICULTY</h3>
            <div className="grid grid-cols-3 gap-3">
              {LEVELS.map((lv) => {
                const isSelected = selectedLevel === lv.id;
                return (
                  <button
                    key={lv.id}
                    onClick={() => setSelectedLevel(lv.id)}
                    className="rounded-2xl p-4 text-left transition-all border-2 hover:scale-[1.02]"
                    style={{
                      background: "#13102a",
                      borderColor: isSelected ? lv.borderColor : `${lv.borderColor}22`,
                      boxShadow: isSelected ? `0 0 0 1px ${lv.borderColor}, 0 4px 16px ${lv.borderColor}25` : "none",
                    }}
                  >
                    <lv.Icon size={24} className="mb-2" style={{ color: lv.badgeColor }} />
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black mb-2 border border-[#1a1a1a]"
                      style={{ background: lv.badgeColor, color: "#000" }}
                    >
                      {lv.badge}
                    </span>
                    <div className="font-black text-[15px] mb-1">{lv.name}</div>
                    <p className="text-white/45 text-[11px] mb-2 leading-snug">{lv.desc}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lv.skills.map(s => (
                        <span
                          key={s}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: `${lv.badgeColor}18`, color: lv.badgeColor }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStartBuilding}
            disabled={!canStart || loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[1.05rem] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: canStart ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" : "rgba(255,255,255,0.08)",
              border: canStart ? "2px solid rgba(255,255,255,0.15)" : "2px solid rgba(255,255,255,0.06)",
              color: "white",
              boxShadow: canStart ? "0 4px 20px rgba(124,58,237,0.4)" : "none",
            }}
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> {isJoining ? "Joining..." : "Creating Session..."}</>
              : isJoining && canStart
              ? <><LogIn size={18} /> Join Room</>
              : canStart
              ? <><Rocket size={18} /> Play as {selectedRole} — {playMode === "ai" ? "with AI" : "Find a Partner"}</>
              : isJoining
              ? "Enter a valid session code"
              : "Select a mode, role, and level to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
