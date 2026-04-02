"use client";

import { ChatMessage } from "@/types";

interface WaitingModalProps {
  messages: ChatMessage[];
}

export default function WaitingModal({ messages }: WaitingModalProps) {
  return (
    <div className="modal">
      <div className="modal-box">
        <h2>STATUS: SYNCING...</h2>
        <p>Your task is complete. Waiting for partner to finish.</p>
        <div className="status-row">
          <span className="dot green" /> YOU: READY
        </div>
        <div className="status-row">
          <span className="dot spin" /> PARTNER: WORKING...
        </div>
        <div className="chat-mini">
          <div className="chat-messages small">
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
        </div>
      </div>
    </div>
  );
}
