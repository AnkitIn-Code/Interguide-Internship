import React, { useEffect, useMemo, useRef, useState } from "react";
import { chatAPI } from "../services/api";

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      text: "Hi! I'm your AI career assistant. Ask me about internships, resumes, or career guidance.",
    },
  ]);
  const listRef = useRef(null);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = requestAnimationFrame(scrollToBottom);
      return () => cancelAnimationFrame(timer);
    }
  }, [messages, isOpen, isSending]);

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setIsSending(true);

    try {
      const { reply } = await chatAPI.sendMessage(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: error.message || "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const gradientClass = useMemo(
    () =>
      "bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600",
    []
  );

  return (
    <>
      <button
        type="button"
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg text-white transition-transform duration-200 ${gradientClass} ${
          isOpen ? "scale-95" : "scale-100"
        }`}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <span className="text-xl font-semibold">×</span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h8M8 14h5m4 5-3.2-2.4a9 9 0 1 1 2.8-2.7L20 19Z"
            />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-6 z-50 w-[92vw] max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/70">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Career Assistant</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Online · Gemini-powered</p>
            </div>
            <button
              type="button"
              onClick={toggleOpen}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div
            ref={listRef}
            className="flex-1 max-h-[60vh] overflow-y-auto px-4 py-3 space-y-3 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900"
          >
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm border ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-white/80 text-slate-900 dark:bg-slate-800/80 dark:text-slate-100 border-slate-200/70 dark:border-slate-700"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:120ms]" />
                    <span className="h-2 w-2 rounded-full bg-indigo-300 animate-bounce [animation-delay:240ms]" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 px-3 py-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about internships, resumes, careers..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className={`h-11 w-11 rounded-xl text-white flex items-center justify-center shadow-md transition-all ${
                  !input.trim() || isSending
                    ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                    : gradientClass
                }`}
                aria-label="Send message"
              >
                {isSending ? (
                  <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2.94 2.94a1.5 1.5 0 0 1 1.59-.35l12 4.5a1.5 1.5 0 0 1 0 2.82l-12 4.5A1.5 1.5 0 0 1 2.5 13.1l2.3-3.07a.5.5 0 0 0-.04-.63L2.5 6.9a1.5 1.5 0 0 1-.44-1.23 1.5 1.5 0 0 1 .88-1.38z" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
