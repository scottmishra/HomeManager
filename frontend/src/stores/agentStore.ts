import { create } from "zustand";
import { api } from "../lib/api";

export type AgentAction =
  | "setup_home"
  | "update_home"
  | "add_appliance"
  | "identify_appliance"
  | "generate_schedule"
  | "adjust_schedule"
  | "get_how_to"
  | "get_product_recommendation"
  | "process_document"
  | "ask_document"
  | "find_contractor"
  | "chat";

export interface AgentMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  action?: AgentAction;
  suggestedActions?: AgentAction[];
  timestamp: Date;
}

interface AgentResponse {
  action: AgentAction;
  message: string;
  data?: Record<string, unknown>;
  suggested_actions?: AgentAction[];
}

interface AgentState {
  messages: AgentMessage[];
  isProcessing: boolean;
  sendMessage: (
    message: string,
    action: AgentAction,
    homeId?: string,
  ) => Promise<void>;
  uploadDocument: (file: File, homeId: string) => Promise<void>;
  clearMessages: () => void;
}

let msgCounter = 0;

export const useAgentStore = create<AgentState>((set) => ({
  messages: [],
  isProcessing: false,

  sendMessage: async (message, action, homeId) => {
    const userMsg: AgentMessage = {
      id: `msg-${++msgCounter}`,
      role: "user",
      content: message,
      action,
      timestamp: new Date(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], isProcessing: true }));

    try {
      const response = await api.post<AgentResponse>("/agent/chat", {
        action,
        message,
        home_id: homeId,
      });
      const agentMsg: AgentMessage = {
        id: `msg-${++msgCounter}`,
        role: "agent",
        content: response.message,
        action: response.action,
        suggestedActions: response.suggested_actions,
        timestamp: new Date(),
      };
      set((s) => ({
        messages: [...s.messages, agentMsg],
        isProcessing: false,
      }));
    } catch (e) {
      const errorMsg: AgentMessage = {
        id: `msg-${++msgCounter}`,
        role: "agent",
        content: `Error: ${(e as Error).message}`,
        timestamp: new Date(),
      };
      set((s) => ({
        messages: [...s.messages, errorMsg],
        isProcessing: false,
      }));
    }
  },

  uploadDocument: async (file, homeId) => {
    set({ isProcessing: true });
    const userMsg: AgentMessage = {
      id: `msg-${++msgCounter}`,
      role: "user",
      content: `Uploading document: ${file.name}`,
      action: "process_document",
      timestamp: new Date(),
    };
    set((s) => ({ messages: [...s.messages, userMsg] }));

    try {
      const response = await api.upload<AgentResponse>(
        "/agent/document",
        file,
        { home_id: homeId },
      );
      const agentMsg: AgentMessage = {
        id: `msg-${++msgCounter}`,
        role: "agent",
        content: response.message,
        suggestedActions: response.suggested_actions,
        timestamp: new Date(),
      };
      set((s) => ({
        messages: [...s.messages, agentMsg],
        isProcessing: false,
      }));
    } catch (e) {
      const errorMsg: AgentMessage = {
        id: `msg-${++msgCounter}`,
        role: "agent",
        content: `Upload failed: ${(e as Error).message}`,
        timestamp: new Date(),
      };
      set((s) => ({
        messages: [...s.messages, errorMsg],
        isProcessing: false,
      }));
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
