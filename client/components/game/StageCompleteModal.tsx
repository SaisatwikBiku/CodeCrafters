"use client";

import { useEffect, useRef } from "react";
import { STAGES } from "@/lib/stages";

interface StageCompleteModalProps {
  completedStage: number;
  score: number;
  onNext: () => void;
}

export default function StageCompleteModal({
  completedStage,
  score,
  onNext,
}: StageCompleteModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const building = STAGES[completedStage - 1]?.building || "Building";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Simple static preview drawn by drawMini equivalent (just background + title)
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width,
      H = canvas.height;
    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`🏫 ${completedStage}/5 stages`, W / 2, H / 2);
  }, [completedStage]);

  return (
    <div className="modal">
      <div className="modal-box celebrate">
        <h2>LEVEL {completedStage} COMPLETE!</h2>
        <p>{building} Built.</p>
        <canvas
          ref={canvasRef}
          width={300}
          height={160}
          style={{ borderRadius: 10, margin: "0.75rem 0" }}
        />
        <p id="complete-score">
          Team Score: {score}/500 | Progress:{" "}
          {((completedStage / 5) * 100).toFixed(0)}%
        </p>
        <button className="btn btn-primary" onClick={onNext}>
          GO TO NEXT LEVEL &gt;&gt;
        </button>
      </div>
    </div>
  );
}
