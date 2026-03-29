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

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [totalStock, pendingRequests, processedToday, wasteItems, totalItems, recentRequests, recentSteps] =
    await Promise.all([
      prisma.inventoryItem.count({
        where: { status: { in: ["RECEIVED", "PROCESSED", "PACKAGED"] } },
      }),
      prisma.request.count({
        where: { status: "PENDING" },
      }),
      prisma.processingStep.count({
        where: { startedAt: { gte: startOfDay } },
      }),
      prisma.inventoryItem.count({
        where: { status: "WASTE", createdAt: { gte: startOfWeek } },
      }),
      prisma.inventoryItem.count({
        where: { createdAt: { gte: startOfWeek } },
      }),
      prisma.request.findMany({
        where: { status: { in: ["PENDING", "PACKING"] } },
        include: { restaurant: true, _count: { select: { items: true } } },
        orderBy: { requestedAt: "desc" },
        take: 5,
      }),
      prisma.processingStep.findMany({
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
        <h1 className="text-2xl font-semibold text-on-surface tracking-tight">Dashboard</h1>
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
              <div className="space-y-4">
                {recentSteps.map((s, i) => (
                  <div key={s.id} className="flex items-start gap-3">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-tertiary mt-1 shrink-0" />
                      {i < recentSteps.length - 1 && (
                        <div className="w-px h-full min-h-[28px] bg-tertiary/20 mt-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-[15px] font-medium text-on-surface leading-snug">
                        {s.performer.name}{" "}
                        <span className="text-on-surface-variant font-normal">
                          {s.stepType.toLowerCase()}ed
                        </span>{" "}
                        &ldquo;{s.sourceItem.name}&rdquo;
                      </p>
                      <p className="text-sm text-on-surface-variant mt-0.5">
                        {s.startedAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card className="rounded-xl border border-outline-variant/15 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-on-surface">Pending Requests</CardTitle>
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
    <Card className="rounded-xl border border-outline-variant/15 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-on-surface-variant">{label}</p>
          <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        </div>
        <p className="text-2xl font-semibold text-on-surface tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
