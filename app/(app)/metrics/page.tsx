import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export default async function MetricsPage() {
  let stats = {
    totalProjects: 0,
    liveProjects: 0,
    avgDaysToLive: 0,
    deploymentsThisMonth: 0,
  };

  if (prisma) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalProjects, liveProjects, deploymentsThisMonth] = await Promise.all([
        prisma.project.count(),
        prisma.project.count({
          where: { stage: { name: "Live" } },
        }),
        prisma.deployment.count({
          where: { createdAt: { gte: startOfMonth } },
        }),
      ]);

      // Calculate average days to live
      const liveProjectsData = await prisma.project.findMany({
        where: { stage: { name: "Live" }, startedAt: { not: null } },
        select: { createdAt: true, startedAt: true },
      });

      let avgDaysToLive = 0;
      if (liveProjectsData.length > 0) {
        const totalDays = liveProjectsData.reduce((sum: number, p: any) => {
          if (!p.startedAt) return sum;
          const days = Math.floor(
            (new Date(p.startedAt).getTime() - new Date(p.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0);
        avgDaysToLive = Math.round(totalDays / liveProjectsData.length);
      }

      stats = {
        totalProjects,
        liveProjects,
        avgDaysToLive,
        deploymentsThisMonth,
      };
    } catch {
      // Database not connected
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Metrics</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Projects</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{stats.totalProjects}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Live Projects</p>
          <p className="mt-2 text-3xl font-bold text-emerald-500">{stats.liveProjects}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Avg. Days to Live</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {stats.avgDaysToLive || "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Deployments (This Month)</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {stats.deploymentsThisMonth}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">Idea-to-Live Time</h2>
        <p className="text-muted-foreground">
          {stats.avgDaysToLive > 0
            ? `On average, projects take ${stats.avgDaysToLive} days from creation to going live.`
            : "No live projects yet. Metrics will appear here once projects ship."}
        </p>
      </div>
    </div>
  );
}
