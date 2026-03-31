"use client";

import { useState, useEffect } from "react";
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
  Building2,
  Plus,
  Unlink,
  UserPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";

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
        <h1 className="text-2xl font-semibold text-on-surface tracking-tight">Settings</h1>
        <p className="text-sm text-on-surface-variant mt-1">Manage your profile and preferences</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Card */}
        <Card className="rounded-xl border border-outline-variant/15">
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
                  Account managed by administrator
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="rounded-xl border border-outline-variant/15">
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
        <Card className="rounded-xl border border-outline-variant/15">
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

        {/* Warehouse Management (Admin only) */}
        {role === "WAREHOUSE_ADMIN" && <RestaurantManagement />}
        {role === "WAREHOUSE_ADMIN" && <TelegramManagement />}

        {/* Application */}
        <Card className="rounded-xl border border-outline-variant/15">
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

/* ─── Restaurant & Staff Management ─── */

interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  users: { id: string; name: string; email: string }[];
}

function RestaurantManagement() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // Add restaurant form
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [newRestName, setNewRestName] = useState("");
  const [newRestAddress, setNewRestAddress] = useState("");
  const [newRestPhone, setNewRestPhone] = useState("");
  const [addingRestaurant, setAddingRestaurant] = useState(false);

  // Add staff form
  const [addingStaffFor, setAddingStaffFor] = useState<string | null>(null);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffError, setStaffError] = useState("");

  useEffect(() => {
    fetch("/api/admin/restaurants")
      .then((r) => r.ok ? r.json() : [])
      .then(setRestaurants)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addRestaurant = async () => {
    if (!newRestName.trim()) return;
    setAddingRestaurant(true);
    const res = await fetch("/api/admin/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newRestName.trim(),
        address: newRestAddress.trim() || undefined,
        phone: newRestPhone.trim() || undefined,
      }),
    });
    if (res.ok) {
      const rest = await res.json();
      setRestaurants((prev) => [...prev, { ...rest, users: [], _count: { requestsFrom: 0 } }]);
      setNewRestName("");
      setNewRestAddress("");
      setNewRestPhone("");
      setShowAddRestaurant(false);
    }
    setAddingRestaurant(false);
  };

  const addStaff = async (restaurantId: string) => {
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim()) return;
    setStaffError("");
    setAddingStaff(true);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: staffName.trim(),
        email: staffEmail.trim(),
        password: staffPassword.trim(),
        restaurantId,
      }),
    });
    if (res.ok) {
      const user = await res.json();
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === restaurantId
            ? { ...r, users: [...r.users, { id: user.id, name: user.name, email: user.email }] }
            : r
        )
      );
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
      setAddingStaffFor(null);
    } else {
      const data = await res.json();
      setStaffError(data.error || "Failed to create staff");
    }
    setAddingStaff(false);
  };

  return (
    <Card className="rounded-xl border border-outline-variant/15">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-on-surface flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Restaurants & Staff
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg text-xs h-8 gap-1.5"
            onClick={() => setShowAddRestaurant(!showAddRestaurant)}
          >
            <Plus className="w-3 h-3" />
            Add Restaurant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-on-surface-variant mb-4">
          Add restaurants and create staff accounts. Staff can sign in on the web or link their Telegram in the section below.
        </p>

        {/* Add restaurant form */}
        {showAddRestaurant && (
          <div className="p-4 rounded-xl bg-surface-container/50 mb-4 space-y-3">
            <p className="text-xs font-semibold text-on-surface">New Restaurant</p>
            <Input
              value={newRestName}
              onChange={(e) => setNewRestName(e.target.value)}
              placeholder="Restaurant name"
              className="rounded-lg h-9 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={newRestAddress}
                onChange={(e) => setNewRestAddress(e.target.value)}
                placeholder="Address (optional)"
                className="rounded-lg h-9 text-sm"
              />
              <Input
                value={newRestPhone}
                onChange={(e) => setNewRestPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="rounded-lg h-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg text-xs h-8"
                onClick={() => setShowAddRestaurant(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-lg text-xs h-8 bg-tertiary hover:bg-tertiary/90 text-white"
                onClick={addRestaurant}
                disabled={addingRestaurant || !newRestName.trim()}
              >
                {addingRestaurant ? <Loader2 className="w-3 h-3 animate-spin" /> : "Create"}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant" />
          </div>
        ) : restaurants.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-4">
            No restaurants yet. Add one to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {restaurants.map((rest) => (
              <div key={rest.id} className="rounded-xl border border-outline-variant/15 overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{rest.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {rest.users.length} staff member{rest.users.length !== 1 ? "s" : ""}
                        {rest.address && ` · ${rest.address}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg text-xs h-8 gap-1"
                    onClick={() => {
                      setAddingStaffFor(addingStaffFor === rest.id ? null : rest.id);
                      setStaffError("");
                      setStaffName("");
                      setStaffEmail("");
                      setStaffPassword("");
                    }}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Staff
                  </Button>
                </div>

                {/* Staff list */}
                {rest.users.length > 0 && (
                  <div className="px-4 pb-3">
                    {rest.users.map((u) => (
                      <div key={u.id} className="flex items-center gap-2 py-1.5 text-xs">
                        <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-on-surface-variant">
                            {u.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-on-surface">{u.name}</span>
                        <span className="text-on-surface-variant">{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add staff form */}
                {addingStaffFor === rest.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-outline-variant/10 space-y-2.5">
                    <p className="text-xs font-semibold text-on-surface">New staff for {rest.name}</p>
                    {staffError && (
                      <p className="text-xs text-error">{staffError}</p>
                    )}
                    <Input
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="Staff name"
                      className="rounded-lg h-9 text-sm"
                    />
                    <Input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="Email address"
                      className="rounded-lg h-9 text-sm"
                    />
                    <Input
                      type="password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="Password (min 6 chars)"
                      className="rounded-lg h-9 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-xs h-8"
                        onClick={() => setAddingStaffFor(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-lg text-xs h-8 bg-tertiary hover:bg-tertiary/90 text-white"
                        onClick={() => addStaff(rest.id)}
                        disabled={addingStaff || !staffName.trim() || !staffEmail.trim() || staffPassword.length < 6}
                      >
                        {addingStaff ? <Loader2 className="w-3 h-3 animate-spin" /> : "Create Staff Account"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Telegram Management ─── */

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
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/telegram/staff")
      .then((r) => r.ok ? r.json() : [])
      .then(setStaff)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  const unlinkUser = async (userId: string) => {
    setUnlinking(userId);
    const res = await fetch("/api/telegram/unlink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setStaff((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, telegramLink: null, linkCode: null } : s))
      );
    }
    setUnlinking(null);
  };

  const copyCode = (code: string, userId: string) => {
    navigator.clipboard.writeText(code);
    setCopied(userId);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="rounded-xl border border-outline-variant/15">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-on-surface flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Telegram Access
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-on-surface-variant mb-4">
          Generate codes for anyone (including yourself) to connect Telegram.
          Enter <code className="bg-surface-container px-1.5 py-0.5 rounded text-xs">/link CODE</code> in the bot.
          Telegram works across all devices once linked.
        </p>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant" />
          </div>
        ) : staff.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-4">No users found</p>
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
                      <p className="text-sm font-medium text-on-surface">
                        {s.name}
                        {s.role === "WAREHOUSE_ADMIN" && (
                          <span className="ml-1.5 text-[10px] text-tertiary font-semibold">ADMIN</span>
                        )}
                      </p>
                      <p className="text-xs text-on-surface-variant">{s.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.telegramLink ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                          Linked{s.telegramLink.telegramName ? ` (${s.telegramLink.telegramName})` : ""}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-lg h-7 w-7 p-0 text-on-surface-variant hover:text-error"
                          onClick={() => unlinkUser(s.id)}
                          disabled={unlinking === s.id}
                          title="Unlink Telegram"
                        >
                          {unlinking === s.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Unlink className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
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
