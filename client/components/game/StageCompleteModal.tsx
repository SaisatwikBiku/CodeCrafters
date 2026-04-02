"use client";

import { useEffect, useRef } from "react";
import { STAGES } from "@/lib/stages";

interface StageCompleteModalProps {
  completedStage: number;
  score: number;
  onNext: () => void;
}

export default function StageCompleteModal({ completedStage, score, onNext }: StageCompleteModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const building = STAGES[completedStage - 1]?.building || "Building";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`🏫 ${completedStage}/5 stages`, W / 2, H / 2);
  }, [completedStage]);

  return (
    /* Modal backdrop */
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
      {/* Modal box — celebrate variant */}
      <div className="bg-white border-[3px] border-[#1a1a1a] rounded-[20px] py-8 px-10 max-w-[420px] w-[90%] text-center shadow-[var(--shadow)]">
        <h2
          className="text-[1.6rem] text-[#22c55e] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          LEVEL {completedStage} COMPLETE!
        </h2>
        <p className="text-[var(--text-muted)] text-[0.9rem] font-bold mb-4">
          {building} Built.
        </p>
        <canvas
          ref={canvasRef}
          width={300}
          height={160}
          className="rounded-[10px] my-3 mx-auto block"
        />
        <p className="text-[var(--text-muted)] text-[0.9rem] font-bold mt-3 mb-5">
          Team Score: {score}/500 | Progress: {((completedStage / 5) * 100).toFixed(0)}%
        </p>
        <button
          onClick={onNext}
          className="w-full py-3 px-5 bg-[#7c3aed] text-white border-2 border-[#1a1a1a] rounded-[10px] font-[900] text-[0.9rem] cursor-pointer shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-y-px active:shadow-[2px_2px_0_#1a1a1a] transition-[transform,box-shadow] duration-100"
          style={{ fontFamily: "var(--font)" }}
        >
          GO TO NEXT LEVEL &gt;&gt;
        </button>
      </div>
    </div>
  );
}
