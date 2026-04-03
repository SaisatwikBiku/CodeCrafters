"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH } from "@/lib/auth";
import { SERVER_URL } from "@/app/CONSTANT";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">("login");

  const inviteSessionId = (searchParams.get("sessionId") || AUTH.getPendingInviteSessionId() || "").trim().toUpperCase();

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async () => {
    setLoginError("");
    if (!loginUsername || !loginPassword) {
      setLoginError("Please fill in all fields.");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Login failed.");
        return;
      }
      AUTH.setAuth(data.token, data.username);
      if (inviteSessionId) {
        AUTH.setPendingInviteSessionId(inviteSessionId);
        router.push(`/lobby?sessionId=${encodeURIComponent(inviteSessionId)}`);
      } else {
        router.push("/lobby");
      }
    } catch {
      setLoginError("Could not connect to server.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegError("");
    if (!regUsername || !regPassword) {
      setRegError("Please fill in all fields.");
      return;
    }
    setRegLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: regUsername, password: regPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Registration failed.");
        return;
      }
      AUTH.setAuth(data.token, data.username);
      if (inviteSessionId) {
        AUTH.setPendingInviteSessionId(inviteSessionId);
        router.push(`/lobby?sessionId=${encodeURIComponent(inviteSessionId)}`);
      } else {
        router.push("/lobby");
      }
    } catch {
      setRegError("Could not connect to server.");
    } finally {
      setRegLoading(false);
    }
  };

  const inputCls =
    "w-full bg-white/10 border border-white/20 rounded-[10px] px-4 py-[0.7rem] text-white font-[700] text-[0.95rem] outline-none placeholder:text-white/45 focus:border-[#fbbf24] focus:shadow-[0_0_0_3px_rgba(251,191,36,0.2)] focus:bg-white/[0.18] transition-[border-color,box-shadow,background] duration-200";

  return (
    /* ── Outer split layout ── */
    <div className="flex w-full h-screen min-h-screen overflow-hidden relative">
      {/* LEFT — hero image */}
      <div
        className="flex-none max-w-[72%] self-stretch shrink-0 border-r border-white/15 min-h-screen bg-[#0d0a1e]"
        style={{
          width: "calc(100vh * 16 / 9)",
          backgroundImage: 'url("/images/Background.jpeg")',
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* RIGHT — dark purple auth panel */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-6 relative z-10"
        style={{
          background:
            "linear-gradient(160deg, #1a0a2e 0%, #2d1069 50%, #1a0a2e 100%)",
        }}
      >
        {/* Branding */}
        <div className="w-full max-w-95 relative z-10">
          <h1
            className="text-[36px] text-white leading-[1.1] mb-2"
            style={{
              fontFamily: "var(--font-display)",
              textShadow: "0 3px 20px rgba(0,0,0,0.6)",
            }}
          >
            Code<span className="text-[#fbbf24]">Crafters!</span>
          </h1>
          <p
            className="text-[13px] border text-white/85 font-bold leading-normal mb-[0.85rem]"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
          >
            Collaborate. Code. Build Your Campus together.
          </p>

          {/* Feature blocks */}
          <div className="flex flex-col gap-2.5 mb-4">
            {[
              "🧱 Play as Architect or Builder",
              "🐍 Learn Python step by step",
              "🏆 5 stages · 500 points",
              "💬 Chat with your partner",
            ].map((text, index) => (
              <p
                key={index}
                className="flex text-xl items-center gap-2.5 bg-white/8 border border-white/18 rounded-md p-4 text-[13px] font-extrabold text-white transition-[transform,background] duration-150 hover:translate-x-1 hover:bg-white/22"
              >
                {text}
              </p>
            ))}
          </div>

          {/* Role chips */}
          <div className="flex gap-2.5 mb-6">
            <div className="border-2 border-white/40 rounded-[20px] px-4 py-1.5 text-[13px] font-black bg-[#fbbf24] text-[#1a1a1a] shadow-(--shadow-sm)">
              🧱 Architect
            </div>
            <div className="border-2 border-[#1a1a1a] rounded-[20px] px-4 py-1.5 text-[13px] font-black bg-[#7c3aed] text-white shadow-(--shadow-sm)">
              🔨 Builder
            </div>
          </div>
        </div>

        {/* Auth box */}
        <div className="w-full max-w-95 bg-white/[0.07] border border-white/15 rounded-2xl px-6 py-5 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  t === "login" ? setLoginError("") : setRegError("");
                }}
                className={[
                  "flex-1 py-2.5 rounded-[10px] text-[14px] font-black text-center cursor-pointer border-2 transition-all duration-150",
                  tab === t
                    ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-[0_2px_10px_rgba(124,58,237,0.5)]"
                    : "bg-white/8 text-white/65 border-white/18 hover:bg-white/[0.14] hover:text-white",
                ].join(" ")}
                style={{ fontFamily: "var(--font)" }}
              >
                {t === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          {/* Login Form */}
          {tab === "login" && (
            <div>
              <p className="text-[20px] font-black text-white mb-1">
                Ready to play? 🎮
              </p>
              <p className="text-[13px] text-white/65 font-bold mb-5">
                Login to jump back in!
              </p>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="👤  Username"
                  maxLength={24}
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className={inputCls}
                />
              </div>
              <div className="mb-4">
                <input
                  type="password"
                  placeholder="🔒  Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className={inputCls}
                />
              </div>
              <button
                disabled={loginLoading}
                onClick={handleLogin}
                className="w-full py-3 px-5 bg-[#7c3aed] text-white border-2 border-[#1a1a1a] rounded-[10px] font-black text-[0.9rem] cursor-pointer shadow-(--shadow-sm) hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-y-px active:shadow-[2px_2px_0_#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-[transform,box-shadow] duration-100"
                style={{ fontFamily: "var(--font)" }}
              >
                {loginLoading ? "Logging in..." : "▶ PLAY NOW!"}
              </button>
              {loginError && (
                <div className="mt-3 text-[#ff6b6b] text-[0.85rem] font-extrabold bg-red-500/15 border border-red-400/30 rounded-lg px-3 py-2">
                  {loginError}
                </div>
              )}
            </div>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <div>
              <p className="text-[20px] font-[900] text-white mb-1">
                Join the fun! 🎉
              </p>
              <p className="text-[13px] text-white/65 font-bold mb-5">
                Create your free account!
              </p>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="👤  Username"
                  maxLength={24}
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  className={inputCls}
                />
              </div>
              <div className="mb-4">
                <input
                  type="password"
                  placeholder="🔒  Password (min 6 chars)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  className={inputCls}
                />
              </div>
              <button
                disabled={regLoading}
                onClick={handleRegister}
                className="w-full py-3 px-5 bg-[#7c3aed] text-white border-2 border-[#1a1a1a] rounded-[10px] font-[900] text-[0.9rem] cursor-pointer shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-y-px active:shadow-[2px_2px_0_#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-[transform,box-shadow] duration-100"
                style={{ fontFamily: "var(--font)" }}
              >
                {regLoading ? "Registering..." : "🚀 Let's Go!"}
              </button>
              {regError && (
                <div className="mt-3 text-[#ff6b6b] text-[0.85rem] font-[800] bg-red-500/15 border border-red-400/30 rounded-[8px] px-3 py-2">
                  {regError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
