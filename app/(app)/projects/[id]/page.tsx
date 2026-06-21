import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const runtime = "nodejs";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!prisma) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Database not connected.</p>
      </div>
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { stage: true, template: true, tasks: { orderBy: { createdAt: "asc" } } },
  });

  if (!project) {
    notFound();
  }

  const doneTasks = project.tasks.filter((t: any) => t.done).length;
  const totalTasks = project.tasks.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          {project.brand && (
            <p className="text-sm text-muted-foreground">{project.brand}</p>
          )}
        </div>
        <Link
          href={`/projects/${project.id}/settings`}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Settings
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {project.stage.name}
        </span>
        {project.githubRepoFullName && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground font-mono">
            {project.githubRepoFullName}
          </span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Brief</h2>
            {project.brief ? (
              <p className="text-muted-foreground whitespace-pre-wrap">{project.brief}</p>
            ) : (
              <p className="text-muted-foreground italic">No brief yet.</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Checklist</h2>
              {totalTasks > 0 && (
                <span className="text-sm text-muted-foreground">
                  {doneTasks}/{totalTasks} done
                </span>
              )}
            </div>

            {totalTasks > 0 && (
              <div className="mb-4 h-2 rounded-full bg-border">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
                />
              </div>
            )}

            {totalTasks === 0 ? (
              <p className="text-muted-foreground italic">No tasks yet.</p>
            ) : (
              <ul className="space-y-2">
                {project.tasks.map((task: any) => (
                  <li key={task.id} className="flex items-center gap-3">
                    <span
                      className={`h-4 w-4 rounded border ${
                        task.done ? "bg-primary border-primary" : "border-border"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        task.done ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {project.template && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Template</h3>
              <p className="mt-1 text-sm text-foreground">{project.template.name}</p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
            <p className="mt-1 text-sm text-foreground">
              {project.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
