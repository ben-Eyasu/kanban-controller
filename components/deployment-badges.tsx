import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface DeploymentBadgesProps {
  projectId: string;
}

export async function DeploymentBadges({ projectId }: DeploymentBadgesProps) {
  if (!prisma) return null;

  let deployments: any[] = [];
  try {
    deployments = await prisma.deployment.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch {
    return null;
  }

  if (deployments.length === 0) return null;

  const statusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "failure":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "✓";
      case "failure":
        return "✗";
      default:
        return "○";
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Deployments</h3>
      <div className="flex flex-wrap gap-2">
        {deployments.map((d) => (
          <a
            key={d.id}
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium hover:opacity-80 transition-opacity ${statusColor(d.status)}`}
          >
            <span>{statusIcon(d.status)}</span>
            <span>{d.environment}</span>
            {d.provider && (
              <span className="text-[10px] opacity-60">({d.provider})</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
