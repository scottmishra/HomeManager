import { ChatInterface } from "../components/agent/ChatInterface";

export function AssistantPage() {
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold">Home Assistant</h1>
        <p className="text-xs text-gray-500">
          AI-powered help for your home maintenance
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
