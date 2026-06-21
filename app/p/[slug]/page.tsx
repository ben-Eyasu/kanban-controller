import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const runtime = "nodejs";

export default async function PublicPortfolioPage({
  params,
}: {
  params: { slug: string };
}) {
  if (!prisma) {
    throw new Error("Database not connected");
  }

  const entry = await prisma.portfolioEntry.findUnique({
    where: { publicSlug: params.slug },
    include: { project: { include: { stage: true, template: true } } },
  });

  if (!entry || !entry.isPublic) {
    notFound();
  }

  const project = entry.project;

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">{project.name}</h1>
        {project.brand && (
          <p className="mt-2 text-lg text-muted-foreground">{project.brand}</p>
        )}
      </div>

      {entry.coverImageUrl && (
        <img
          src={entry.coverImageUrl}
          alt={project.name}
          className="w-full rounded-lg border border-border"
        />
      )}

      {entry.summary && (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-muted-foreground whitespace-pre-wrap">{entry.summary}</p>
        </div>
      )}

      {project.brief && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">Project Brief</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{project.brief}</p>
        </div>
      )}

      {project.githubRepoFullName && (
        <div className="text-center">
          <a
            href={`https://github.com/${project.githubRepoFullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            View on GitHub
          </a>
        </div>
      )}
    </div>
  );
}
