import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export default async function NotificationsPage() {
  let events: any[] = [];

  if (prisma) {
    try {
      events = await prisma.activityEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { project: { select: { name: true } } },
      });
    } catch {
      // Database not connected
    }
  }

  function formatEvent(event: any): string {
    const payload = event.payload || {};
    switch (event.type) {
      case "push":
        const commits = payload.commits?.length ?? 0;
        const branch = payload.ref?.replace("refs/heads/", "") ?? "unknown";
        return `Pushed ${commits} commit(s) to ${branch}`;
      case "pull_request":
        const pr = payload.pull_request;
        return `PR #${pr?.number}: ${payload.action} — ${pr?.title ?? ""}`;
      case "issues":
        return `Issue #${payload.issue?.number}: ${payload.action} — ${payload.issue?.title ?? ""}`;
      case "deployment_status":
        return `Deployment: ${payload.deployment_status?.state ?? "unknown"}`;
      default:
        return event.type;
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Notifications</h1>

      {events.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No activity yet. Connect a GitHub repository to see events here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {event.type}
                </span>
                <div>
                  <p className="text-sm text-foreground">{formatEvent(event)}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.project?.name ?? "Unknown project"} •{" "}
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
