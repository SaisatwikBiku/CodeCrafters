"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTH } from "@/lib/auth";
import { useGame } from "@/lib/game-context";
import dynamic from "next/dynamic";

const CampusCanvas = dynamic(() => import("@/components/campus/CampusCanvas"), {
  ssr: false,
});

export default function CompletePage() {
  const router = useRouter();
  const { state } = useGame();

  useEffect(() => {
    if (!AUTH.isLoggedIn()) router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      {/* Complete card */}
      <div className="text-center p-12 bg-white rounded-[20px] border-[3px] border-[#1a1a1a] shadow-[var(--shadow)]">
        <h1
          className="text-[2.5rem] mb-4 text-[#1a1a1a]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          🎉 School Complete!
        </h1>
        <p className="text-[var(--text-muted)] font-bold">
          Your team built the entire campus and mastered Python fundamentals.
        </p>

        <div className="mx-auto my-6 w-[500px] h-[350px]">
          <CampusCanvas
            completedStages={5}
            style={{ width: "100%", height: "100%", borderRadius: 12, border: "2px solid var(--black)" }}
          />
        </div>

        <p className="text-[var(--purple)] font-[900] text-[1.1rem] my-4">
          Final Score: {state.score}/500
        </p>

        <button
          onClick={() => router.push("/lobby")}
          className="mt-4 py-3 px-5 bg-[#7c3aed] text-white border-2 border-[#1a1a1a] rounded-[10px] font-[900] text-[0.9rem] cursor-pointer shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-y-px active:shadow-[2px_2px_0_#1a1a1a] transition-[transform,box-shadow] duration-100"
          style={{ fontFamily: "var(--font)" }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
