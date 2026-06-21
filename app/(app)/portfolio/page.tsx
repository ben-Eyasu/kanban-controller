import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const runtime = "nodejs";

export default async function PortfolioPage() {
  let projects: any[] = [];
  let portfolios: any[] = [];

  if (prisma) {
    try {
      projects = await prisma.project.findMany({
        include: { portfolioEntry: true, stage: true },
        orderBy: { id: "desc" as const },
      });
      portfolios = await prisma.portfolioEntry.findMany({
        where: { isPublic: true },
        include: { project: { select: { name: true } } },
        orderBy: { id: "desc" as const },
      });
    } catch {
      // Database not connected
    }
  }

  // Filter to only "Live" stage projects
  const liveProjects = projects.filter(
    (p: any) => p.stage?.name === "Live" && !p.portfolioEntry
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>

      {/* Published */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Published</h2>
        {portfolios.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">No published projects yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Move a project to "Live" stage to publish it.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {portfolios.map((entry: any) => (
              <a
                key={entry.id}
                href={`/p/${entry.publicSlug}`}
                target="_blank"
                className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
              >
                <h3 className="font-medium text-foreground">{entry.project?.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">/p/{entry.publicSlug}</p>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Available to publish */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Available to Publish</h2>
        {liveProjects.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">No projects in Live stage yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {liveProjects.map((project: any) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <div>
                  <h3 className="text-sm font-medium text-foreground">{project.name}</h3>
                  {project.brand && (
                    <p className="text-xs text-muted-foreground">{project.brand}</p>
                  )}
                </div>
                <form action={`/api/portfolio/publish`} method="POST">
                  <input type="hidden" name="projectId" value={project.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Publish
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
