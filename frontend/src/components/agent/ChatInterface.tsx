import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { useAgentStore, type AgentAction } from "../../stores/agentStore";
import { useHomeStore } from "../../stores/homeStore";

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

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [action, setAction] = useState<AgentAction>("chat");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isProcessing, sendMessage, uploadDocument } =
    useAgentStore();
  const { selectedHome } = useHomeStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const msg = input;
    setInput("");
    await sendMessage(msg, action, selectedHome?.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedHome) return;
    await uploadDocument(file, selectedHome.id);
    e.target.value = "";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-lg font-medium">Hi! I'm your home maintenance assistant.</p>
            <p className="mt-2 text-sm">
              Ask me to set up your home, create a maintenance schedule, or get
              how-to guides for any task.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.suggestedActions.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAction(a)}
                      className="rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700 hover:bg-brand-100"
                    >
                      {ACTION_LABELS[a]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3">
              <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action selector + Input */}
      <div className="border-t border-gray-200 bg-white p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {(Object.entries(ACTION_LABELS) as [AgentAction, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setAction(key)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
                  action === key
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
            title="Upload document"
          >
            <Paperclip size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileUpload}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask me anything about your home..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={isProcessing || !input.trim()}
            className="rounded-full bg-brand-600 p-2.5 text-white disabled:opacity-50 hover:bg-brand-700"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
