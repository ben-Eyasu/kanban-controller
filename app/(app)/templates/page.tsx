import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const runtime = "nodejs";

export default async function TemplatesPage() {
  let templates: any[] = [];

  if (prisma) {
    try {
      templates = await prisma.template.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // Database not connected
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Templates</h1>
        <Link
          href="/templates/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No templates yet. Create your first template to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/templates/${template.id}`}
              className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
              {template.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground font-mono">
                {template.templateRepoFullName}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
