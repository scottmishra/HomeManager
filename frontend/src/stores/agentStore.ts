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

const ACTION_LABELS: Record<AgentAction, string> = {
  setup_home: "Set Up Home",
  update_home: "Update Home",
  add_appliance: "Add Appliance",
  identify_appliance: "Identify Appliance",
  generate_schedule: "Generate Schedule",
  adjust_schedule: "Adjust Schedule",
  get_how_to: "How-To Guide",
  get_product_recommendation: "Product Recommendation",
  process_document: "Process Document",
  ask_document: "Ask About Document",
  find_contractor: "Find Contractor",
  chat: "General Chat",
};

export interface AgentMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  action?: AgentAction;
  suggestedActions?: AgentAction[];
  timestamp: Date;
}

interface PrototypeChatResponse {
  message: string;
  sdk: string;
}

interface UploadResponse {
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
    action?: AgentAction,
    homeId?: string,
  ) => Promise<void>;
  uploadDocument: (file: File, homeId: string) => Promise<void>;
  clearMessages: () => void;
}

let msgCounter = 0;

export const useAgentStore = create<AgentState>((set) => ({
  messages: [],
  isProcessing: false,

  sendMessage: async (message, action = "chat", _homeId) => {
    const userMsg: AgentMessage = {
      id: `msg-${++msgCounter}`,
      role: "user",
      content: message,
      action,
      timestamp: new Date(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], isProcessing: true }));

    try {
      const systemPrompt =
        action !== "chat"
          ? `You are a helpful home maintenance assistant. The user wants to: ${ACTION_LABELS[action]}.`
          : "You are a helpful home maintenance assistant.";

      const response = await api.post<PrototypeChatResponse>("/prototype/chat", {
        message,
        system_prompt: systemPrompt,
      });
      const agentMsg: AgentMessage = {
        id: `msg-${++msgCounter}`,
        role: "agent",
        content: response.message,
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
      const response = await api.upload<UploadResponse>(
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
