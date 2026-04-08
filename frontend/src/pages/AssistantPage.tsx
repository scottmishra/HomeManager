import { ChatInterface } from "../components/agent/ChatInterface";

export function AssistantPage() {
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col md:h-screen">
      <div className="shrink-0 border-b border-warm-200 bg-white/95 px-4 py-3 backdrop-blur-sm md:px-8">
        <h1 className="font-display text-xl font-semibold text-warm-900">
          Home Assistant
        </h1>
        <p className="text-xs text-warm-500">
          AI-powered help for your home maintenance
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
