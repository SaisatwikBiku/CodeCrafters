export type Role = "Architect" | "Builder";

export interface GameState {
  socket: any | null;
  sessionId: string | null;
  playerName: string | null;
  role: Role | null;
  currentStage: number;
  score: number;
  completedStages: number;
}

export interface Task {
  title: string;
  description: string;
  steps: string[];
  starterCode: string;
  expected_output: string | null;
}

export interface Stage {
  stageNumber: number;
  building: string;
  tasks: {
    Architect: Task;
    Builder: Task;
  };
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  isSystem?: boolean;
}

export interface ActiveSession {
  id: string;
  stage: number;
  role: Role;
}

export interface RunCodeResponse {
  stdout?: string;
  stderr?: string;
  status?: string;
  passed?: boolean;
}
