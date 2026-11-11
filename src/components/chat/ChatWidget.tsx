"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  MessageSquare,
  X,
  Minus,
  Send,
  Phone,
  Mail,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Clock,
  Headset,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

interface MessageItem {
  id: string;
  role: "assistant" | "user";
  content: string;
  citations?: Array<{ title: string; slug?: string; sourceType?: string }>;
  createdAt?: string;
  feedback?: { rating: number } | null;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [showCallbackCard, setShowCallbackCard] = useState(false);
  const [callbackSubmitted, setCallbackSubmitted] = useState(false);
  const [callbackRefId, setCallbackRefId] = useState("");
  const [callbackLoading, setCallbackLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Callback form state
  const [cbName, setCbName] = useState("");
  const [cbPhone, setCbPhone] = useState("");
  const [cbEmail, setCbEmail] = useState("");
  const [cbMethod, setCbMethod] = useState<"PHONE" | "EMAIL">("PHONE");
  const [cbTimeWindow, setCbTimeWindow] = useState("Weekday Afternoon (2 PM - 5 PM)");
  const [cbConsent, setCbConsent] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize or resume chat session
  useEffect(() => {
    let mounted = true;
    async function initSession() {
      try {
        const res = await fetch("/api/chat/session");
        const data = await res.json();
        if (mounted && data.success) {
          setConversationId(data.conversationId);
          if (data.config?.suggestedQuestions) {
            setSuggestedQuestions(data.config.suggestedQuestions);
          }

          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          } else {
            // Initial English Welcome Message
            setMessages([
              {
                id: "welcome-msg",
                role: "assistant",
                content:
                  data.config?.welcomeMessage ||
                  "Hello! Welcome to Vantage Wealth. I'm your Vantage Wealth Assistant. I can help you understand our wealth advisory services, explore relevant information and arrange a callback from our team. How may I assist you today?",
                createdAt: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (e) {
        console.error("Failed to initialize chat session:", e);
      }
    }

    initSession();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen, isMinimized, showCallbackCard]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !conversationId || isLoading) return;

    setInputText("");
    setErrorMsg(null);

    const tempUserMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content: text,
        }),
      });

      const data = await res.json();

      if (data.success && data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.message.id,
            role: "assistant",
            content: data.message.content,
            citations: data.message.citations,
            createdAt: data.message.createdAt,
          },
        ]);

        if (data.suggestCallback) {
          setShowCallbackCard(true);
        }
      } else {
        setErrorMsg(data.error || "Unable to reach the advisory concierge. Please try again.");
      }
    } catch {
      setErrorMsg("Connection interrupted. Please verify your connection or request a callback.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || callbackLoading) return;
    setErrorMsg(null);

    if (!cbName.trim()) {
      setErrorMsg("Please provide your full name.");
      return;
    }
    if (cbMethod === "PHONE" && !cbPhone.trim()) {
      setErrorMsg("Please provide a phone number for callback.");
      return;
    }
    if (cbMethod === "EMAIL" && (!cbEmail.trim() || !cbEmail.includes("@"))) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }
    if (!cbConsent) {
      setErrorMsg("Please confirm your contact consent.");
      return;
    }

    setCallbackLoading(true);

    try {
      const res = await fetch("/api/chat/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          fullName: cbName,
          phone: cbPhone,
          email: cbEmail,
          preferredMethod: cbMethod,
          preferredTimeWindow: cbTimeWindow,
          consentGiven: cbConsent,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCallbackSubmitted(true);
        setCallbackRefId(data.referenceId || "CB-CONFIRMED");
        setMessages((prev) => [
          ...prev,
          {
            id: `cb-confirm-${Date.now()}`,
            role: "assistant",
            content: `Thank you, ${cbName}. Your callback request (${data.referenceId}) has been registered. Our wealth advisory desk will contact you during standard business hours (Monday to Friday, 9:30 AM – 6:30 PM IST).`,
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setErrorMsg(data.error || "Failed to submit callback request.");
      }
    } catch {
      setErrorMsg("Failed to submit callback request. Please try again.");
    } finally {
      setCallbackLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    try {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: { rating } } : m))
      );
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating }),
      });
    } catch (e) {
      console.error("Feedback error:", e);
    }
  };

  return (
    <div className="chatbot-portal fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 font-sans max-w-[calc(100vw-24px)] sm:max-w-none">
      {/* 1. Floating Launcher Button (Icon Only with Premium High-Contrast Gold Badge) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 bg-[#172B46] hover:bg-[#1C3455] text-white rounded-full shadow-[0_10px_30px_rgba(23,43,70,0.35)] border-2 border-[#B08D57] transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#B08D57] cursor-pointer"
          aria-label="Open Vantage Wealth Assistant"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#C9A975] via-[#B08D57] to-[#91703E] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Headset className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#172B46] stroke-[2.2]" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#172B46] animate-pulse" />
          </div>
        </button>
      )}

      {/* 2. Main Chat Drawer Window */}
      {isOpen && (
        <div
          className={`flex flex-col bg-[#F7F5F0] rounded-xl sm:rounded-2xl shadow-[0_16px_48px_rgba(23,43,70,0.25)] border border-[#B08D57]/40 transition-all duration-300 overflow-hidden ${
            isMinimized
              ? "w-72 sm:w-80 h-12"
              : "w-[calc(100vw-24px)] sm:w-[360px] h-[70vh] sm:h-[500px] max-h-[70vh] sm:max-h-[500px]"
          }`}
        >
          {/* Header */}
          <div className="relative bg-[#172B46] text-white px-3.5 py-2.5 sm:px-4 sm:py-2.5 flex items-center justify-between border-b border-[#B08D57]/30 shrink-0">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B08D57] to-transparent" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A975] via-[#B08D57] to-[#91703E] flex items-center justify-center shadow-xs shrink-0">
                <Headset className="w-3.5 h-3.5 text-[#172B46] stroke-[2.2]" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 ring-1 ring-[#172B46] rounded-full" />
              </div>
              <div className="min-w-0">
                <h3 className="font-sans text-[16px] font-semibold tracking-tight text-white flex items-center gap-1.5 truncate leading-tight">
                  Vantage Wealth Assistant
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                title={isMinimized ? "Expand" : "Minimize"}
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                title="Close"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 min-h-0 p-3 sm:p-3.5 overflow-y-auto space-y-2.5">
                {messages.map((m) => {
                  const isAssistant = m.role === "assistant";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        isAssistant ? "items-start" : "items-end"
                      }`}
                    >
                      <div
                        className={`max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-[1.55] ${
                          isAssistant
                            ? "bg-white text-[#172B46] border-l-2 border-l-[#B08D57] shadow-2xs border border-stone-200/70"
                            : "bg-[#172B46] text-white shadow-2xs"
                        }`}
                      >
                        <p className="whitespace-pre-line text-[13px] leading-[1.55]">{m.content}</p>

                        {/* Citations / Source Badges */}
                        {isAssistant && m.citations && m.citations.length > 0 && (
                          <div className="mt-1.5 pt-1.5 border-t border-stone-100 flex flex-wrap gap-1">
                            {m.citations.map((c, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[10px] bg-[#F7F5F0] text-[#172B46]/80 px-1.5 py-0.5 rounded border border-stone-200"
                              >
                                <span>{c.title}</span>
                                {c.slug && <ExternalLink className="w-2.5 h-2.5 text-[#B08D57]" />}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Timestamp & Feedback for Assistant */}
                      <div className="flex items-center gap-1.5 mt-0.5 px-1">
                        <span className="text-[10px] text-stone-500">
                          {m.createdAt
                            ? new Date(m.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>

                        {isAssistant && m.id !== "welcome-msg" && (
                          <div className="flex items-center gap-1 text-stone-500">
                            <button
                              onClick={() => handleFeedback(m.id, 5)}
                              className={`p-0.5 rounded hover:text-[#B08D57] cursor-pointer ${
                                m.feedback?.rating === 5 ? "text-[#B08D57]" : ""
                              }`}
                              title="Helpful"
                              aria-label="Helpful"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(m.id, 1)}
                              className={`p-0.5 rounded hover:text-red-500 cursor-pointer ${
                                m.feedback?.rating === 1 ? "text-red-500" : ""
                              }`}
                              title="Not helpful"
                              aria-label="Not helpful"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-start">
                    <div className="bg-white text-[#172B46] border-l-2 border-l-[#B08D57] px-3 py-1.5 rounded-xl shadow-2xs border border-stone-200/70 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#B08D57] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-[#B08D57] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-[#B08D57] rounded-full animate-bounce" />
                      <span className="text-[11px] text-stone-600 font-light ml-1">
                        Consulting knowledge desk...
                      </span>
                    </div>
                  </div>
                )}

                {/* Suggested Questions Pills (Initial) */}
                {messages.length <= 1 && suggestedQuestions.length > 0 && !isLoading && (
                  <div className="pt-1.5">
                    <p className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                      Suggested Inquiries
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="text-left text-[12px] leading-snug bg-white hover:bg-[#F0EDE6] text-[#172B46] px-2.5 py-1.5 rounded-md border border-stone-200 transition-colors shadow-2xs cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Callback Request Drawer Card */}
                {showCallbackCard && !callbackSubmitted && (
                  <div className="bg-white rounded-lg p-3 border border-[#B08D57]/40 shadow-2xs mt-1.5">
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-stone-100">
                      <h4 className="font-sans text-[12px] font-semibold text-[#172B46] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#B08D57]" />
                        Request Private Advisory Callback
                      </h4>
                      <button
                        onClick={() => setShowCallbackCard(false)}
                        className="text-stone-500 hover:text-stone-800 cursor-pointer"
                        aria-label="Dismiss callback card"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <form onSubmit={handleCallbackSubmit} className="space-y-2">
                      <div>
                        <input
                          type="text"
                          placeholder="Your Full Name"
                          value={cbName}
                          onChange={(e) => setCbName(e.target.value)}
                          className="w-full text-[12px] px-2.5 py-1.5 rounded border border-stone-300 focus:outline-none focus:border-[#B08D57]"
                          required
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCbMethod("PHONE")}
                          className={`flex-1 py-1 text-[11px] rounded border font-medium cursor-pointer ${
                            cbMethod === "PHONE"
                              ? "bg-[#172B46] text-white border-[#172B46]"
                              : "bg-stone-50 text-stone-600 border-stone-200"
                          }`}
                        >
                          Phone Call
                        </button>
                        <button
                          type="button"
                          onClick={() => setCbMethod("EMAIL")}
                          className={`flex-1 py-1 text-[11px] rounded border font-medium cursor-pointer ${
                            cbMethod === "EMAIL"
                              ? "bg-[#172B46] text-white border-[#172B46]"
                              : "bg-stone-50 text-stone-600 border-stone-200"
                          }`}
                        >
                          Email Summary
                        </button>
                      </div>

                      {cbMethod === "PHONE" ? (
                        <div>
                          <input
                            type="tel"
                            placeholder="Phone Number (+91 XXXXX XXXXX)"
                            value={cbPhone}
                            onChange={(e) => setCbPhone(e.target.value)}
                            className="w-full text-[12px] px-2.5 py-1.5 rounded border border-stone-300 focus:outline-none focus:border-[#B08D57]"
                            required
                          />
                        </div>
                      ) : (
                        <div>
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={cbEmail}
                            onChange={(e) => setCbEmail(e.target.value)}
                            className="w-full text-[12px] px-2.5 py-1.5 rounded border border-stone-300 focus:outline-none focus:border-[#B08D57]"
                            required
                          />
                        </div>
                      )}

                      <div>
                        <select
                          value={cbTimeWindow}
                          onChange={(e) => setCbTimeWindow(e.target.value)}
                          className="w-full text-[11px] px-2.5 py-1.5 rounded border border-stone-300 bg-white text-stone-700 focus:outline-none focus:border-[#B08D57]"
                        >
                          <option value="Morning (10 AM - 1 PM IST)">Morning (10 AM - 1 PM IST)</option>
                          <option value="Weekday Afternoon (2 PM - 5 PM)">Weekday Afternoon (2 PM - 5 PM IST)</option>
                          <option value="Evening (5 PM - 6:30 PM IST)">Evening (5 PM - 6:30 PM IST)</option>
                        </select>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <input
                          type="checkbox"
                          id="chat-consent"
                          checked={cbConsent}
                          onChange={(e) => setCbConsent(e.target.checked)}
                          className="mt-0.5 accent-[#B08D57]"
                          required
                        />
                        <label htmlFor="chat-consent" className="text-[10px] text-stone-500 leading-tight">
                          I consent to Vantage Wealth contacting me regarding wealth advisory services.
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={callbackLoading}
                        className="w-full py-1.5 bg-[#B08D57] hover:bg-[#9a7b4c] text-white text-[11px] font-medium rounded transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {callbackLoading ? "Submitting..." : "Confirm Callback Request"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Callback Submitted Confirmation Badge */}
                {callbackSubmitted && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-[11px]">Callback Registered: {callbackRefId}</p>
                      <p className="text-[10px] text-emerald-700">
                        Our private wealth advisory team has been notified.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Quick Action Bar (Request Callback button) */}
              {!showCallbackCard && !callbackSubmitted && (
                <div className="px-3 py-1 bg-stone-100/80 border-t border-stone-200/80 flex justify-between items-center text-[11px] shrink-0">
                  <span className="text-stone-500 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-[#B08D57]" /> Mon–Fri 9:30–18:30
                  </span>
                  <button
                    onClick={() => setShowCallbackCard(true)}
                    className="text-[#B08D57] hover:text-[#172B46] font-medium flex items-center gap-1 hover:underline text-[11px] cursor-pointer"
                  >
                    <Phone className="w-2.5 h-2.5" /> Request Callback
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div className="p-2.5 bg-white border-t border-stone-200/80 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask about wealth planning, PMS, family trust..."
                    disabled={isLoading}
                    className="flex-1 text-[13px] px-3 py-1.5 bg-[#F7F5F0] rounded-lg border border-stone-200 focus:outline-none focus:border-[#B08D57] text-[#172B46] placeholder:text-stone-400 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-1.5 bg-[#172B46] hover:bg-[#253f63] text-white rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-[#172B46] shrink-0 cursor-pointer"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5 text-[#B08D57]" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
