"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  MessageSquare,
  Search,
  Paperclip,
  Smile,
  Phone,
  Video,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const AVATAR_COLORS = [
  "bg-tertiary/10 text-tertiary",
  "bg-emerald-500/10 text-emerald-600",
  "bg-amber-500/10 text-amber-600",
  "bg-violet-500/10 text-violet-600",
];

function getAvatarColor(name: string) {
  const charCode = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
}

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatConvoTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return "TODAY";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "YESTERDAY";
  return date
    .toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
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

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const [convosLoaded, setConvosLoaded] = useState(false);

  const isRestaurant = session?.user?.role === "RESTAURANT_STAFF";

  const hasSession = !!session?.user;

  useEffect(() => {
    if (convosLoaded || !hasSession) return;

    fetch("/api/messages/conversations")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data);
        if (data.length > 0 && isRestaurant) {
          setActiveConversation(data[0].id);
        }
        setLoading(false);
        setConvosLoaded(true);
      })
      .catch(() => setLoading(false));
  }, [convosLoaded, isRestaurant, hasSession]);

  const fetchMessages = useCallback(async () => {
    if (!activeConversation) return;
    const res = await fetch(`/api/messages/${activeConversation}`);
    const data = await res.json();
    setMessages(data);
  }, [activeConversation]);

  useEffect(() => {
    if (!activeConversation) return;

    fetchMessages();

    function startPolling() {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchMessages, 30000);
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
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    const res = await fetch(`/api/messages/${activeConversation}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });

    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation
            ? { ...c, lastMessage: { content: msg.content, createdAt: msg.createdAt }, unreadCount: 0 }
            : c
        )
      );
    }
    setSending(false);
  }

  const activeConvo = conversations.find((c) => c.id === activeConversation);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      conv.restaurantName.toLowerCase().includes(q) ||
      conv.warehouseName.toLowerCase().includes(q) ||
      conv.lastMessage?.content.toLowerCase().includes(q)
    );
  });

  const chatPartnerName = isRestaurant
    ? activeConvo?.warehouseName
    : activeConvo?.restaurantName;

  const messageGroups = groupMessagesByDate(messages);

  return (
    <AppShell title="Messages">
      <div className="flex h-[calc(100vh-10rem)] gap-0">
        {/* Left panel - Conversation list */}
        {!isRestaurant && (
          <Card className="w-[340px] shrink-0 flex flex-col rounded-2xl rounded-r-none border-0 shadow-sm overflow-hidden">
            {/* Panel header */}
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-lg font-semibold text-on-surface">Messages</h2>
            </div>

            {/* Search bar */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-9 rounded-xl bg-surface-container border-0 h-9 text-sm placeholder:text-on-surface-variant/50"
                />
              </div>
            </div>

            {/* Conversation list */}
            <ScrollArea className="flex-1">
              <div className="px-2 pb-2">
                {loading ? (
                  <p className="text-sm text-on-surface-variant p-3">Loading...</p>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
                    <p className="text-sm text-on-surface-variant">
                      {searchQuery ? "No conversations found" : "No conversations yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredConversations.map((conv) => {
                      const avatarColor = getAvatarColor(conv.restaurantName);
                      const isActive = activeConversation === conv.id;
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setActiveConversation(conv.id)}
                          className={cn(
                            "w-full text-left px-3 py-3 rounded-xl transition-all duration-150 flex items-center gap-3",
                            isActive
                              ? "bg-tertiary/5 border-l-2 border-tertiary"
                              : "hover:bg-surface-container border-l-2 border-transparent"
                          )}
                        >
                          {/* Avatar */}
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                              avatarColor
                            )}
                          >
                            <span className="text-sm font-semibold">
                              {conv.restaurantName.charAt(0)}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span
                                className={cn(
                                  "text-sm truncate",
                                  conv.unreadCount > 0
                                    ? "font-semibold text-on-surface"
                                    : "font-medium text-on-surface"
                                )}
                              >
                                {conv.restaurantName}
                              </span>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {conv.lastMessage && (
                                  <span className="text-[11px] text-on-surface-variant/70">
                                    {formatConvoTime(conv.lastMessage.createdAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              {conv.lastMessage ? (
                                <p
                                  className={cn(
                                    "text-xs truncate",
                                    conv.unreadCount > 0
                                      ? "text-on-surface-variant font-medium"
                                      : "text-on-surface-variant/60"
                                  )}
                                >
                                  {conv.lastMessage.content}
                                </p>
                              ) : (
                                <p className="text-xs text-on-surface-variant/40 italic">
                                  No messages yet
                                </p>
                              )}
                              {conv.unreadCount > 0 && (
                                <span className="w-2.5 h-2.5 rounded-full bg-tertiary shrink-0 ml-2" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* Right panel - Chat window */}
        <Card
          className={cn(
            "flex-1 flex flex-col overflow-hidden rounded-2xl border-0 shadow-sm",
            !isRestaurant && "rounded-l-none"
          )}
        >
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-on-surface-variant/30" />
              </div>
              <div className="text-center">
                <p className="text-on-surface font-medium mb-1">No conversation selected</p>
                <p className="text-sm text-on-surface-variant/60">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-3 border-b border-outline-variant/10 flex items-center justify-between bg-surface-lowest">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      getAvatarColor(chatPartnerName || "?")
                    )}
                  >
                    <span className="text-sm font-semibold">
                      {chatPartnerName?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      {chatPartnerName}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wide">
                        Active now
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl"
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages area */}
              <ScrollArea className="flex-1 px-5 py-4">
                <div className="space-y-1">
                  {messages.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="w-6 h-6 text-on-surface-variant/30" />
                      </div>
                      <p className="text-sm text-on-surface-variant">
                        No messages yet. Say hello!
                      </p>
                    </div>
                  )}

                  {messageGroups.map((group) => (
                    <div key={group.label}>
                      {/* Day separator */}
                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-outline-variant/15" />
                        <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                          {group.label}
                        </span>
                        <div className="flex-1 h-px bg-outline-variant/15" />
                      </div>

                      {/* Messages in this group */}
                      <div className="space-y-3">
                        {group.messages.map((msg) => {
                          const isOwn = msg.sender.id === session?.user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex flex-col max-w-[70%]",
                                isOwn ? "ml-auto items-end" : "items-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "px-4 py-2.5 text-sm leading-relaxed",
                                  isOwn
                                    ? "bg-tertiary text-white rounded-2xl rounded-br-sm"
                                    : "bg-surface-container text-on-surface rounded-2xl rounded-bl-sm"
                                )}
                              >
                                {msg.content}
                              </div>
                              <span className="text-[10px] text-on-surface-variant/50 mt-1 px-1">
                                {formatMessageTime(msg.createdAt)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message input */}
              <div className="px-4 py-3 border-t border-outline-variant/10 bg-surface-lowest">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 text-on-surface-variant/50 hover:text-on-surface-variant hover:bg-surface-container rounded-xl shrink-0"
                  >
                    <Paperclip className="w-4.5 h-4.5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sending}
                      autoFocus
                      className="rounded-xl bg-surface-container border-0 pr-10 h-10 text-sm placeholder:text-on-surface-variant/40"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                    >
                      <Smile className="w-4.5 h-4.5" />
                    </button>
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sending || !newMessage.trim()}
                    className="bg-tertiary hover:bg-tertiary-dim text-on-tertiary shrink-0 rounded-xl w-10 h-10 disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
