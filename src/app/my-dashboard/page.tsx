import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ClipboardList, CheckCircle, PlusCircle, ArrowRight, User } from "lucide-react";
import Link from "next/link";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function RestaurantDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "RESTAURANT_STAFF") redirect("/login");

  const locationId = session.user.locationId;
  if (!locationId) redirect("/login");

  const userName = session.user.name ?? "there";

  const now = new Date();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [activeRequests, deliveredThisWeek, recentRequests] = await Promise.all([
    prisma.request.count({
      where: { restaurantId: locationId, status: { in: ["PENDING", "PACKING", "DISPATCHED"] } },
    }),
    prisma.request.count({
      where: { restaurantId: locationId, status: "DELIVERED", deliveredAt: { gte: startOfWeek } },
    }),
    prisma.request.findMany({
      where: { restaurantId: locationId },
      include: { _count: { select: { items: true } } },
      orderBy: { requestedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <AppShell title="My Dashboard">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-on-surface-variant mt-1">Here&apos;s your restaurant overview</p>
      </div>

      {/* CTA Card */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 mb-6 overflow-hidden relative">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">Create a stock requisition</p>
            <h2 className="text-xl font-semibold text-white">Need ingredients?</h2>
          </div>
          <Link href="/new-request">
            <Button className="bg-tertiary hover:bg-tertiary-dim text-on-tertiary rounded-xl h-11 px-5 text-sm font-semibold gap-2">
              <PlusCircle className="w-4 h-4" />
              New Request
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6 text-tertiary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface leading-none">{activeRequests}</p>
                <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mt-1">
                  Active Requests
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface leading-none">{deliveredThisWeek}</p>
                <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mt-1">
                  Delivered This Week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card className="rounded-2xl border-0 shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-semibold text-on-surface">Recent Requests</CardTitle>
          <Link
            href="/my-requests"
            className="inline-flex items-center gap-1 text-sm text-tertiary hover:text-tertiary-dim font-medium transition-colors"
          >
            View All History
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-6 h-6 text-tertiary" />
              </div>
              <p className="text-sm font-medium text-on-surface mb-1">No requests yet</p>
              <p className="text-sm text-on-surface-variant mb-4">
                Submit your first ingredient request to get started.
              </p>
              <Link href="/new-request">
                <Button className="bg-tertiary hover:bg-tertiary-dim text-on-tertiary rounded-xl">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  New Request
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRequests.map((req) => (
                <Link
                  key={req.id}
                  href={`/my-requests/${req.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface group-hover:text-tertiary transition-colors">
                      {req.requestNumber}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {req._count.items} items &middot;{" "}
                      {req.requestedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Info Card */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-tertiary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-surface">{session.user.name}</p>
              <p className="text-xs text-on-surface-variant capitalize">
                {session.user.role?.replace(/_/g, " ").toLowerCase()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
