"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  MessageSquare, Send, Bot, User, Sparkles, RefreshCw, Leaf, HelpCircle, ShieldCheck, Navigation, Layers
} from "lucide-react";
import { sendChatMessage, ChatMessage } from "@/lib/api";
import { useLanguage, Language } from "@/context/LanguageContext";
import { useActiveFarm } from "@/context/ActiveFarmContext";

const QUICK_PROMPTS_MAP: Record<Language, string[]> = {
  en: [
    "What should I do today?",
    "What is my farm area?",
    "What is the weather?",
    "Where should I sell my wheat?",
    "What should I do with Field 2?"
  ],
  hi: [
    "आज मुझे क्या करना चाहिए?",
    "मेरे खेत का क्षेत्रफल कितना है?",
    "मौसम कैसा है?",
    "मुझे अपना गेहूं कहां बेचना चाहिए?",
    "मुझे फील्ड 2 के साथ क्या करना चाहिए?"
  ],
  pa: [
    "ਅੱਜ ਮੈਨੂੰ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ?",
    "ਮੇਰੇ ਖੇਤ ਦਾ ਖੇਤਰਫਲ ਕਿੰਨਾ ਹੈ?",
    "ਮੌਸਮ ਕਿਹੋ ਜਿਹਾ ਹੈ?",
    "ਮੈਨੂੰ ਆਪਣੀ ਕਣਕ ਕਿੱਥੇ ਵੇਚਣੀ ਚਾਹੀਦੀ ਹੈ?",
    "ਮੈਨੂੰ ਫੀਲਡ 2 ਨਾਲ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ?"
  ],
  bho: [
    "आजु हमरा का करे के चाहीं?",
    "हमरा खेत के एरिया केतना बा?",
    "मौसम कइसन बा?",
    "हम आपन गेहूँ कहाँ बेचीं?",
    "फिल्ड 2 खातिर सलाह दीं"
  ],
  hr: [
    "आज मन्नै के करना चाहिए?",
    "मेरे खेत का एरिया कितना सै?",
    "मौसम कैस्या सै?",
    "कनक कित बेचूं?",
    "फील्ड 2 खात्तर सलाह देओ"
  ]
};

function ChatContent() {
  const { language, t, getBackendLanguageName } = useLanguage();
  const { activeFarm } = useActiveFarm();
  const searchParams = useSearchParams();
  
  const fieldIdParam = searchParams.get("field_id") 
    ? parseInt(searchParams.get("field_id")!, 10) 
    : undefined;

  const selectedField = fieldIdParam && activeFarm?.fields 
    ? activeFarm.fields.find(f => f.id === fieldIdParam) 
    : undefined;

  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; time: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = QUICK_PROMPTS_MAP[language] || QUICK_PROMPTS_MAP.en;

  useEffect(() => {
    let welcome = `Hello! I am AgroGuard AI Assistant. I understand your active farm "${activeFarm?.name || 'AgroGuard Farm'}". Ask me anything about your farm tasks, weather, mandi prices, or fields.`;
    if (language === "hi") {
      welcome = `नमस्कार! मैं एग्रोगार्ड एआई सहायक हूँ। मैं आपके सक्रिय खेत "${activeFarm?.name || 'खेत'}" को समझता हूँ। मुझसे खेती के काम, मौसम, मंडी भाव या खेतों के बारे में कुछ भी पूछें।`;
    } else if (language === "pa") {
      welcome = `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਮੈਂ ਐਗਰੋਗਾਰਡ ਏਆਈ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੇ ਖੇਤ "${activeFarm?.name || 'ਖੇਤ'}" ਨੂੰ ਸਮਝਦਾ ਹਾਂ। ਮੈਨੂੰ ਕੰਮਾਂ, ਮੌਸਮ, ਮੰਡੀ ਭਾਅ ਜਾਂ ਖੇਤਾਂ ਬਾਰੇ ਪੁੱਛੋ।`;
    }

    setMessages([
      {
        role: "assistant",
        content: welcome,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [language, activeFarm?.farm_id]);

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
      const historyPayload: ChatMessage[] = messages.map(m => ({ role: m.role, content: m.content }));
      const backendLang = getBackendLanguageName();
      
      const response = await sendChatMessage(
        query, 
        historyPayload, 
        backendLang,
        activeFarm?.farm_id,
        fieldIdParam
      );
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply, time: response.timestamp }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I couldn't connect to the AI agricultural reasoning engine right now. Please verify your backend server.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{t.chat.title}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className="text-xs text-slate-400">Contextual AI Farm Advisor</p>
          </div>
        </div>
      </div>

      {/* ACTIVE FARM & FIELD CONTEXT BANNER */}
      {activeFarm && (
        <div className="glass-panel px-4 py-2.5 rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-950/30 via-slate-900/90 to-emerald-950/20 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="text-slate-300">Active Farm: <strong className="text-white">{activeFarm.name}</strong></span>
            <span className="text-slate-500">•</span>
            <span className="text-teal-400 font-semibold">{activeFarm.area_acres} Acres</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{activeFarm.district || "Punjab"}</span>
          </div>

          {selectedField && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 font-bold">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Field: {selectedField.name} ({selectedField.crop})</span>
            </div>
          )}
        </div>
      )}

      {/* QUICK PROMPT CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
        <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-xs font-semibold text-slate-400 shrink-0">{t.chat.quickQuestions}</span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-xs text-slate-300 hover:text-white transition-all whitespace-nowrap shrink-0"
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
              <span>Analyzing Active Farm context & generating advice...</span>
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
          placeholder={t.chat.placeholder}
          className="flex-1 px-5 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">{t.chat.send}</span>
        </button>
      </form>

    </div>
  );
}

import { AuthGuard } from "@/components/AuthGuard";

export default function ChatPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading Active Farm Chatbot...</p>
        </div>
      }>
        <ChatContent />
      </Suspense>
    </AuthGuard>
  );
}

