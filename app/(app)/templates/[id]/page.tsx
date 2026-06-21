import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const runtime = "nodejs";

export default async function TemplateDetailPage({
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

  const template = await prisma.template.findUnique({
    where: { id: params.id },
  });

  if (!template) {
    notFound();
  }

  const checklist = (template.defaultChecklist as string[]) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{template.name}</h1>
        <div className="flex gap-2">
          <Link
            href={`/templates/${template.id}/edit`}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        {template.description && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
            <p className="mt-1 text-foreground">{template.description}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Repository</h3>
          <p className="mt-1 font-mono text-sm text-foreground">{template.templateRepoFullName}</p>
        </div>

        {template.defaultStack && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Default Stack</h3>
            <p className="mt-1 text-foreground">{template.defaultStack}</p>
          </div>
        )}

        {checklist.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Default Checklist</h3>
            <ul className="mt-2 space-y-1">
              {checklist.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-4 w-4 rounded border border-border" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
