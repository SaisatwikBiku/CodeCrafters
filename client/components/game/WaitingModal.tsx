"use client";

import { ChatMessage } from "@/types";

interface WaitingModalProps {
  messages: ChatMessage[];
}

export default function WaitingModal({ messages }: WaitingModalProps) {
  return (
    /* Modal backdrop */
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
      {/* Modal box */}
      <div className="bg-white border-[3px] border-[#1a1a1a] rounded-[20px] py-8 px-10 max-w-[420px] w-[90%] text-center shadow-[var(--shadow)]">
        <h2
          className="text-[1.4rem] text-[#7c3aed] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          STATUS: SYNCING...
        </h2>
        <p className="text-[var(--text-muted)] text-[0.9rem] font-bold mb-4">
          Your task is complete. Waiting for partner to finish.
        </p>

        {/* Status rows */}
        <div className="flex items-center gap-[0.6rem] my-[0.4rem] text-[0.85rem] font-[900]">
          <span className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-[#1a1a1a] bg-[#22c55e]" />
          YOU: READY
        </div>
        <div className="flex items-center gap-[0.6rem] my-[0.4rem] text-[0.85rem] font-[900]">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0 bg-transparent"
            style={{
              border: "3px solid var(--surface2)",
              borderTopColor: "var(--orange)",
              animation: "spin 0.8s linear infinite",
            }}
          />
          PARTNER: WORKING...
        </div>

        {/* Mini chat */}
        <div className="mt-3 text-left">
          <div className="max-h-[100px] overflow-y-auto flex flex-col gap-[0.3rem] text-[0.75rem]">
            {messages.map((m) => (
              <div key={m.id} className="flex gap-2">
                {!m.isSystem && <span className="text-[#7c3aed] font-[900]">{m.sender}:</span>}
                <span className={`font-bold ${m.isSystem ? "text-[var(--text-muted)] italic" : "text-[var(--text)]"}`}>
                  {m.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
