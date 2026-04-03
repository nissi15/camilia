import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Package, ClipboardList, Scissors, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function WarehouseDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "WAREHOUSE_ADMIN") redirect("/login");

  const warehouseId = session.user.locationId;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  // Get restaurant IDs linked to this warehouse
  const linkedRestaurants = await prisma.conversation.findMany({
    where: { warehouseId: warehouseId! },
    select: { restaurantId: true },
  });
  const linkedRestaurantIds = linkedRestaurants.map((c) => c.restaurantId);

  const [totalStock, pendingRequests, processedToday, wasteItems, totalItems, recentRequests, recentSteps] =
    await Promise.all([
      prisma.inventoryItem.count({
        where: { locationId: warehouseId!, status: { in: ["RECEIVED", "PROCESSED", "PACKAGED"] } },
      }),
      prisma.request.count({
        where: { status: "PENDING", restaurantId: { in: linkedRestaurantIds } },
      }),
      prisma.processingStep.count({
        where: { startedAt: { gte: startOfDay }, sourceItem: { locationId: warehouseId! } },
      }),
      prisma.inventoryItem.count({
        where: { locationId: warehouseId!, status: "WASTE", createdAt: { gte: startOfWeek } },
      }),
      prisma.inventoryItem.count({
        where: { locationId: warehouseId!, createdAt: { gte: startOfWeek } },
      }),
      prisma.request.findMany({
        where: { status: { in: ["PENDING", "PACKING"] }, restaurantId: { in: linkedRestaurantIds } },
        include: { restaurant: true, _count: { select: { items: true } } },
        orderBy: { requestedAt: "desc" },
        take: 5,
      }),
      prisma.processingStep.findMany({
        where: { sourceItem: { locationId: warehouseId! } },
        include: {
          sourceItem: { select: { name: true } },
          performer: { select: { name: true } },
        },
        orderBy: { startedAt: "desc" },
        take: 5,
      }),
    ]);

  const wastePercentage = totalItems > 0 ? (wasteItems / totalItems) * 100 : 0;

  return (
    <AppShell title="Dashboard">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-1">Central warehouse operations overview</p>
      </div>

      {/* Unified Metrics Bar */}
      <Card className="rounded-xl border border-outline-variant/15 mb-8">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-outline-variant/10">
            <MetricCell icon={Package} label="Total Stock" value={String(totalStock)} />
            <MetricCell icon={ClipboardList} label="Pending Requests" value={String(pendingRequests)} />
            <MetricCell icon={Scissors} label="Processed Today" value={String(processedToday)} />
            <MetricCell icon={Trash2} label="Waste % This Week" value={`${wastePercentage.toFixed(1)}%`} accent={wastePercentage > 5} />
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="rounded-xl border border-outline-variant/15">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-on-surface">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSteps.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No recent activity</p>
            ) : (
              <div className="space-y-1">
                {recentSteps.map((s) => {
                  const stepColors: Record<string, string> = {
                    BUTCHER: "bg-emerald-500",
                    PORTION: "bg-sky-500",
                    PACKAGE: "bg-violet-500",
                    CUSTOM: "bg-amber-500",
                  };
                  const badgeColors: Record<string, string> = {
                    BUTCHER: "bg-emerald-500/10 text-emerald-700",
                    PORTION: "bg-sky-500/10 text-sky-700",
                    PACKAGE: "bg-violet-500/10 text-violet-700",
                    CUSTOM: "bg-amber-500/10 text-amber-700",
                  };
                  const iconColor = stepColors[s.stepType] || "bg-tertiary";
                  const badgeStyle = badgeColors[s.stepType] || "bg-tertiary/10 text-tertiary";
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-container/40 transition-colors">
                      <div className={`w-9 h-9 ${iconColor} rounded-xl flex items-center justify-center shrink-0`}>
                        <Scissors className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface leading-snug truncate">
                          {s.sourceItem.name}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {s.performer.name} &middot; {s.startedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${badgeStyle} uppercase tracking-wide shrink-0`}>
                        {s.stepType}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold text-on-surface">Pending Requests</CardTitle>
            <Link
              href="/requests"
              className="inline-flex items-center gap-1 text-sm text-tertiary hover:text-tertiary-dim font-medium transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No pending requests</p>
            ) : (
              <div className="space-y-2">
                {recentRequests.map((req) => (
                  <Link
                    key={req.id}
                    href={`/requests/${req.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-on-surface group-hover:text-tertiary transition-colors">
                        {req.requestNumber}
                      </p>
                      <p className="text-sm text-on-surface-variant mt-0.5">
                        {req.restaurant.name} &middot; {req._count.items} items
                      </p>
                    </div>
                    <StatusBadge status={req.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function MetricCell({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-5">
      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
        <Icon className={`w-4 h-4 ${accent ? "text-error" : "text-on-surface-variant"}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-on-surface-variant">{label}</p>
        <p className={`text-2xl font-bold tracking-tight leading-none mt-0.5 ${accent ? "text-error" : "text-on-surface"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-on-surface-variant">{label}</p>
            <p className="text-2xl font-bold text-on-surface tracking-tight leading-none mt-0.5">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
