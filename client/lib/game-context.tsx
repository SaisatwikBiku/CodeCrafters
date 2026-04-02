"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { GameState, Role } from "@/types";

interface GameContextType {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  updateState: (patch: Partial<GameState>) => void;
}

const defaultState: GameState = {
  socket: null,
  sessionId: null,
  playerName: null,
  role: null,
  currentStage: 1,
  score: 0,
  completedStages: 0,
};

export const GameContext = createContext<GameContextType>({
  state: defaultState,
  setState: () => {},
  updateState: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(defaultState);

  const updateState = (patch: Partial<GameState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  return (
    <GameContext.Provider value={{ state, setState, updateState }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
