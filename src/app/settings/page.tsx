"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Shield,
  MapPin,
  CalendarDays,
  Bell,
  PackageCheck,
  MessageSquare,
  AlertTriangle,
  LogOut,
  Info,
  Smartphone,
  Copy,
  Check,
  Loader2,
  Users,
} from "lucide-react";

function formatRole(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface NotificationPref {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOn: boolean;
}

const notificationPrefs: NotificationPref[] = [
  {
    key: "expiry",
    label: "Expiry Alerts",
    description: "Get notified when items are approaching their expiry date",
    icon: AlertTriangle,
    defaultOn: true,
  },
  {
    key: "requests",
    label: "Request Updates",
    description: "Notifications when request status changes",
    icon: PackageCheck,
    defaultOn: true,
  },
  {
    key: "messages",
    label: "New Messages",
    description: "Alert when you receive new chat messages",
    icon: MessageSquare,
    defaultOn: true,
  },
  {
    key: "lowStock",
    label: "Low Stock Warnings",
    description: "Warnings when inventory falls below minimum levels",
    icon: Bell,
    defaultOn: false,
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(notificationPrefs.map((p) => [p.key, p.defaultOn]))
  );

  const user = session?.user;
  const name = user?.name ?? "User";
  const email = user?.email ?? "";
  const role = user?.role ?? "RESTAURANT_STAFF";
  const locationName = user?.locationName ?? "Unassigned";

  const handleToggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AppShell title="Settings">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Settings</h1>
        <p className="text-on-surface-variant mt-1">Manage your profile and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Card */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-tertiary">
                  {getInitials(name)}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-on-surface">{name}</h2>
                <p className="text-sm text-on-surface-variant mt-0.5">{email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-tertiary/10 text-tertiary px-2.5 py-1 rounded-full">
                    <Shield className="w-3 h-3" />
                    {formatRole(role)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <MapPin className="w-3 h-3" />
                    {locationName}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3" />
                  Member since March 2026
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-on-surface">
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-on-surface-variant mb-4">
              Account details are managed by your administrator and cannot be edited.
            </p>
            <div className="space-y-4">
              <InfoRow icon={User} label="Full Name" value={name} />
              <Separator />
              <InfoRow icon={Mail} label="Email Address" value={email} />
              <Separator />
              <InfoRow icon={Shield} label="Role" value={formatRole(role)} />
              <Separator />
              <InfoRow icon={MapPin} label="Location" value={locationName} />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-on-surface">
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-on-surface-variant mb-4">
              Choose which notifications you want to receive.
            </p>
            <div className="space-y-1">
              {notificationPrefs.map((pref, i) => (
                <div key={pref.key}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0 mt-0.5">
                        <pref.icon className="w-4 h-4 text-on-surface-variant" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{pref.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {pref.description}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={toggles[pref.key]}
                      onClick={() => handleToggle(pref.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                        toggles[pref.key] ? "bg-tertiary" : "bg-surface-container"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          toggles[pref.key] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  {i < notificationPrefs.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Telegram Staff Management (Warehouse Admin only) */}
        {role === "WAREHOUSE_ADMIN" && <TelegramManagement />}

        {/* Application */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-on-surface">
              Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-on-surface-variant" />
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">StockTrace v0.1.0</p>
                <p className="text-xs text-on-surface-variant">Restaurant ingredient tracking system</p>
              </div>
            </div>
            <Separator />
            <div className="mt-5">
              <Button
                variant="destructive"
                className="rounded-xl h-10 px-5 gap-2 text-sm font-medium"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-on-surface-variant" />
        <span className="text-sm text-on-surface-variant">{label}</span>
      </div>
      <span className="text-sm font-medium text-on-surface">{value}</span>
    </div>
  );
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  linkCode: string | null;
  telegramLink: { telegramName: string | null } | null;
}

function TelegramManagement() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useState(() => {
    fetch("/api/telegram/staff")
      .then((r) => r.ok ? r.json() : [])
      .then(setStaff)
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  const generateCode = async (userId: string) => {
    setGenerating(userId);
    const res = await fetch("/api/telegram/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const { code } = await res.json();
      setStaff((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, linkCode: code } : s))
      );
    }
    setGenerating(null);
  };

  const copyCode = (code: string, userId: string) => {
    navigator.clipboard.writeText(code);
    setCopied(userId);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-on-surface flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Telegram Staff Access
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-on-surface-variant mb-4">
          Generate link codes for staff to connect their Telegram accounts to StockTrace.
          Staff enters <code className="bg-surface-container px-1.5 py-0.5 rounded text-xs">/link CODE</code> in the Telegram bot.
        </p>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant" />
          </div>
        ) : staff.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-4">No staff users found</p>
        ) : (
          <div className="space-y-1">
            {staff.map((s, i) => (
              <div key={s.id}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-on-surface-variant" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{s.name}</p>
                      <p className="text-xs text-on-surface-variant">{s.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.telegramLink ? (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                        Linked{s.telegramLink.telegramName ? ` (${s.telegramLink.telegramName})` : ""}
                      </span>
                    ) : s.linkCode ? (
                      <button
                        onClick={() => copyCode(s.linkCode!, s.id)}
                        className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded-lg font-mono font-medium hover:bg-amber-100 transition-colors"
                      >
                        {s.linkCode}
                        {copied === s.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-xs h-8"
                        onClick={() => generateCode(s.id)}
                        disabled={generating === s.id}
                      >
                        {generating === s.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Generate Code"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {i < staff.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
