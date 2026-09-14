"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, Send, Bot, User, Sparkles, RefreshCw, Leaf, HelpCircle, ShieldCheck 
} from "lucide-react";
import { sendChatMessage, ChatMessage } from "@/lib/api";

const QUICK_PROMPTS = [
  "Why are my wheat leaves turning yellow?",
  "When should I irrigate my wheat crop?",
  "What is the best fertilizer for Basmati rice?",
  "How can I prevent yellow rust during cool humid weather?"
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; time: string }>>([
    {
      role: "assistant",
      content: "Hello! I am AgroGuard AI Assistant. Ask me anything about crop diseases, fertilizers, irrigation schedules, or seasonal farming advice.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: "user" as const, content: query, time: currentTime };
    
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      // Build history payload
      const historyPayload: ChatMessage[] = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await sendChatMessage(query, historyPayload);
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply, time: response.timestamp }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I couldn't reach the agricultural knowledge engine right now. Please ensure the backend server is running.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>AgroGuard AI Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className="text-xs text-slate-400">Multimodal Gemini Agricultural Scientist</p>
          </div>
        </div>
      </div>

      {/* QUICK PROMPT CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none shrink-0">
        <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-xs font-semibold text-slate-400 shrink-0">Quick Questions:</span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-xs text-slate-300 hover:text-white transition-all whitespace-nowrap shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* CHAT MESSAGES DISPLAY BOX */}
      <div className="flex-1 glass-panel p-4 sm:p-6 rounded-3xl overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              msg.role === "user" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
            }`}>
              {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] p-4 rounded-2xl space-y-1 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-blue-600 text-white rounded-tr-none"
                : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none"
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <span className={`block text-[10px] text-right ${msg.role === "user" ? "text-blue-200" : "text-slate-500"}`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 rounded-tl-none flex items-center gap-2 text-xs text-emerald-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>AgroGuard AI is generating advice...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* CHAT INPUT FORM */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AgroGuard about crop leaves, pests, weather, or mandi prices..."
          className="flex-1 px-5 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>

    </div>
  );
}
