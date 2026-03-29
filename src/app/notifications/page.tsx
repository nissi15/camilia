"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Package,
  ClipboardList,
  CheckCircle,
  MessageSquare,
  Info,
  Bell,
  BellOff,
  CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

type FilterTab = "ALL" | "UNREAD" | "REQUESTS" | "ALERTS" | "MESSAGES";

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "ALL" },
  { label: "Unread", value: "UNREAD" },
  { label: "Requests", value: "REQUESTS" },
  { label: "Alerts", value: "ALERTS" },
  { label: "Messages", value: "MESSAGES" },
];

function getNotificationIcon(type: string) {
  switch (type) {
    case "EXPIRY_WARNING":
      return <AlertTriangle className="w-5 h-5" />;
    case "LOW_STOCK":
      return <Package className="w-5 h-5" />;
    case "REQUEST_CREATED":
    case "REQUEST_STATUS_CHANGED":
      return <ClipboardList className="w-5 h-5" />;
    case "DELIVERY_CONFIRMED":
      return <CheckCircle className="w-5 h-5" />;
    case "NEW_MESSAGE":
      return <MessageSquare className="w-5 h-5" />;
    case "SYSTEM":
    default:
      return <Info className="w-5 h-5" />;
  }
}

function getIconContainerClass(type: string) {
  switch (type) {
    case "EXPIRY_WARNING":
      return "bg-amber-50 text-amber-600";
    case "LOW_STOCK":
      return "bg-amber-50 text-amber-500";
    case "REQUEST_CREATED":
    case "REQUEST_STATUS_CHANGED":
      return "bg-tertiary/10 text-tertiary";
    case "DELIVERY_CONFIRMED":
      return "bg-tertiary/10 text-tertiary";
    case "NEW_MESSAGE":
      return "bg-tertiary/10 text-tertiary";
    case "SYSTEM":
    default:
      return "bg-surface-container text-on-surface-variant";
  }
}

function filterNotifications(
  notifications: Notification[],
  filter: FilterTab
): Notification[] {
  switch (filter) {
    case "UNREAD":
      return notifications.filter((n) => !n.readAt);
    case "REQUESTS":
      return notifications.filter(
        (n) =>
          n.type === "REQUEST_CREATED" || n.type === "REQUEST_STATUS_CHANGED"
      );
    case "ALERTS":
      return notifications.filter(
        (n) => n.type === "EXPIRY_WARNING" || n.type === "LOW_STOCK"
      );
    case "MESSAGES":
      return notifications.filter((n) => n.type === "NEW_MESSAGE");
    default:
      return notifications;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const filtered = filterNotifications(notifications, activeFilter);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
  };

  const markAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
    );
    await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.readAt) {
      markAsRead(notification.id);
    }
    if (notification.href && /^\/[a-zA-Z0-9\-_\/\?\=\&\#]*$/.test(notification.href)) {
      router.push(notification.href);
    }
  };

  return (
    <AppShell title="Notifications">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-tertiary text-on-tertiary text-xs font-semibold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            className="text-tertiary hover:bg-tertiary/10"
            onClick={markAllAsRead}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-surface-container p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`
              flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all
              ${
                activeFilter === tab.value
                  ? "bg-surface-lowest text-on-surface"
                  : "text-on-surface-variant hover:text-on-surface"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-0">
              <CardContent className="p-4">
                <div className="flex items-start gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-surface-container" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-surface-container" />
                    <div className="h-3 w-2/3 rounded bg-surface-container" />
                    <div className="h-3 w-20 rounded bg-surface-container" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <div className="rounded-full bg-surface-container p-4 mb-4">
            <BellOff className="w-8 h-8" />
          </div>
          <p className="text-lg font-medium">No notifications</p>
          <p className="text-sm mt-1">
            {activeFilter === "ALL"
              ? "You're all caught up!"
              : "No notifications match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => {
            const isUnread = !notification.readAt;
            return (
              <Card
                key={notification.id}
                className={`
                  rounded-2xltransition-all
                  ${isUnread ? "bg-surface-lowest" : "bg-surface"}
                  ${notification.href ? "cursor-pointer hover:bg-surface-container/30" : ""}
                `}
                onClick={() => handleNotificationClick(notification)}
                onMouseEnter={() => setHoveredId(notification.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Unread Indicator */}
                    <div className="flex items-center pt-2.5">
                      <div
                        className={`w-2 h-2 rounded-full transition-opacity ${
                          isUnread
                            ? "bg-tertiary opacity-100"
                            : "opacity-0"
                        }`}
                      />
                    </div>

                    {/* Icon */}
                    <div
                      className={`
                        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                        ${getIconContainerClass(notification.type)}
                      `}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-tight ${
                            isUnread
                              ? "font-semibold text-on-surface"
                              : "font-medium text-on-surface"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-on-surface-variant whitespace-nowrap">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              { addSuffix: true }
                            )}
                          </span>
                          {isUnread && hoveredId === notification.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-on-surface-variant hover:text-tertiary h-6 text-xs px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
