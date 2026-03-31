"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTelegram } from "../providers";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Conversation {
  id: string;
  restaurantName: string;
  warehouseName: string;
  lastMessage: { content: string; createdAt: string } | null;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) return "TODAY";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) return "YESTERDAY";
  return date.toLocaleDateString([], { month: "short", day: "numeric" }).toUpperCase();
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { label: string; messages: Message[] }[] = [];
  let currentLabel = "";
  for (const msg of messages) {
    const label = getDateLabel(msg.createdAt);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

export default function TgMessagesPage() {
  const { user, apiFetch } = useTelegram();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRestaurant = user?.role === "RESTAURANT_STAFF";

  // Fetch conversations
  useEffect(() => {
    apiFetch("/api/messages/conversations")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data);
        // Auto-select for restaurant staff (usually 1 conversation)
        if (data.length === 1 && isRestaurant) {
          setActiveConvoId(data[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiFetch, isRestaurant]);

  const fetchMessages = useCallback(async () => {
    if (!activeConvoId) return;
    try {
      const res = await apiFetch(`/api/messages/${activeConvoId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      // silently skip on polling errors
    }
  }, [activeConvoId, apiFetch]);

  // Fetch messages + poll
  useEffect(() => {
    if (!activeConvoId) return;
    fetchMessages();
    function startPolling() {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchMessages, 5000);
    }
    function handleVisibility() {
      if (document.hidden) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
      } else {
        fetchMessages();
        startPolling();
      }
    }
    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [activeConvoId, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvoId) return;
    setSending(true);
    try {
      const res = await apiFetch(`/api/messages/${activeConvoId}`, {
        method: "POST",
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvoId
              ? { ...c, lastMessage: { content: msg.content, createdAt: msg.createdAt }, unreadCount: 0 }
              : c
          )
        );
      }
    } catch {
      // silently ignore
    }
    setSending(false);
  }

  const activeConvo = conversations.find((c) => c.id === activeConvoId);
  const partnerName = isRestaurant ? activeConvo?.warehouseName : activeConvo?.restaurantName;
  const messageGroups = groupMessagesByDate(messages);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // No conversations
  if (conversations.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/tg" className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Messages</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">No conversations yet</p>
        </div>
      </div>
    );
  }

  // Conversation list (when multiple conversations and none selected)
  if (!activeConvoId) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/tg" className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Messages</h1>
            <p className="text-xs text-gray-500">Chat with warehouse</p>
          </div>
        </div>
        <div className="space-y-2">
          {conversations.map((conv) => {
            const displayName = isRestaurant ? conv.warehouseName : conv.restaurantName;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConvoId(conv.id)}
                className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 text-left active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-emerald-700">{displayName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 truncate">{displayName}</span>
                    {conv.lastMessage && (
                      <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-400 truncate">
                      {conv.lastMessage?.content || "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 ml-2">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Chat header */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-3 shrink-0">
        {conversations.length > 1 && (
          <button
            onClick={() => { setActiveConvoId(null); setMessages([]); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}
        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-emerald-700">{partnerName?.charAt(0) || "?"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{partnerName}</p>
          <p className="text-[11px] text-gray-400">{isRestaurant ? "Warehouse" : "Restaurant"}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="w-10 h-10 text-gray-200 mb-2" />
            <p className="text-xs text-gray-400">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messageGroups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="space-y-2">
                  {group.messages.map((msg) => {
                    const isOwn = msg.sender.id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOwn ? "ml-auto items-end max-w-[80%]" : "items-start max-w-[80%]"}`}
                      >
                        <div
                          className={`px-3.5 py-2 text-sm leading-relaxed ${
                            isOwn
                              ? "bg-emerald-600 text-white rounded-2xl rounded-br-sm"
                              : "bg-white text-gray-900 rounded-2xl rounded-bl-sm shadow-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-gray-300 mt-0.5 px-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="px-3 py-2.5 bg-white border-t border-gray-100 shrink-0 safe-area-bottom">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 h-10 rounded-xl bg-gray-50 border border-gray-200 px-3 text-sm placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 active:bg-emerald-700"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
