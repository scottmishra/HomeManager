import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, MessageSquare } from "lucide-react";
import { useAgentStore } from "../../stores/agentStore";
import { useHomeStore } from "../../stores/homeStore";

const PROMPT_SUGGESTIONS = [
  "Generate a maintenance schedule for my home",
  "What appliances should I service this season?",
  "How do I change my HVAC filter?",
];

export function ChatInterface() {
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isProcessing, sendMessage, uploadDocument } =
    useAgentStore();
  const { selectedHome } = useHomeStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  const handleSend = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || isProcessing) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(msg, "chat", selectedHome?.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedHome) return;
    await uploadDocument(file, selectedHome.id);
    e.target.value = "";
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center animate-fade-in">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <MessageSquare className="h-7 w-7 text-brand-600" />
            </div>
            <h3 className="font-display text-xl font-semibold text-warm-900 mb-1">
              Your home assistant
            </h3>
            <p className="mb-6 max-w-xs text-sm text-warm-600">
              Ask me to schedule maintenance, explain a task, or analyze your home.
            </p>
            <div className="flex w-full max-w-xs flex-col gap-2">
              {PROMPT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-left text-sm text-warm-700 transition-colors hover:bg-warm-50 hover:text-warm-900"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "rounded-2xl rounded-br-md bg-brand-600 text-white"
                      : "rounded-2xl rounded-bl-md border border-warm-200 bg-white text-warm-900 shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-warm-200 bg-white px-4 py-3.5 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-warm-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-warm-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-warm-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-warm-200 bg-white/95 p-3 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-full p-2 text-warm-400 transition-colors hover:bg-warm-100 hover:text-warm-800"
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
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything about your home…"
            className="max-h-40 flex-1 resize-none overflow-y-auto rounded-2xl border border-warm-200 bg-white px-4 py-2.5 text-sm placeholder:text-warm-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
            disabled={isProcessing}
          />
          <button
            onClick={() => handleSend()}
            disabled={isProcessing || !input.trim()}
            className="shrink-0 rounded-full bg-brand-600 p-2.5 text-white transition-all duration-100 hover:scale-105 hover:bg-brand-700 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
