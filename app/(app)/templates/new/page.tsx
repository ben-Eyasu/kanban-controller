import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default function NewTemplatePage() {
  async function createTemplate(formData: FormData) {
    "use server";

    if (!prisma) {
      throw new Error("Database not connected");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const templateRepoFullName = formData.get("templateRepoFullName") as string;
    const defaultStack = formData.get("defaultStack") as string;
    const checklistRaw = formData.get("defaultChecklist") as string;

    // Validate repo format: owner/repo
    if (!templateRepoFullName || !/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(templateRepoFullName)) {
      throw new Error("Invalid repository format. Expected: owner/repo");
    }

    const defaultChecklist = checklistRaw
      ? checklistRaw.split("\n").filter((line) => line.trim())
      : [];

    // Get the first workspace (Phase 1: single workspace)
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      throw new Error("No workspace found");
    }

    const template = await prisma.template.create({
      data: {
        workspaceId: workspace.id,
        name,
        description: description || null,
        templateRepoFullName,
        defaultStack: defaultStack || null,
        defaultChecklist: defaultChecklist.length > 0 ? defaultChecklist : undefined,
      },
    });

    redirect(`/templates/${template.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">New Template</h1>

      <form action={createTemplate} className="space-y-6 rounded-lg border border-border bg-card p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. Next.js marketing site"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Brief description of this template"
          />
        </div>

        <div>
          <label htmlFor="templateRepoFullName" className="block text-sm font-medium text-foreground">
            Template Repository <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="templateRepoFullName"
            name="templateRepoFullName"
            required
            pattern="[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+"
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="owner/repo"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            GitHub template repository in owner/repo format
          </p>
        </div>

        <div>
          <label htmlFor="defaultStack" className="block text-sm font-medium text-foreground">
            Default Stack
          </label>
          <input
            type="text"
            id="defaultStack"
            name="defaultStack"
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. Next.js, Tailwind, Prisma"
          />
        </div>

        <div>
          <label htmlFor="defaultChecklist" className="block text-sm font-medium text-foreground">
            Default Checklist
          </label>
          <textarea
            id="defaultChecklist"
            name="defaultChecklist"
            rows={5}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="One task per line&#10;Set up project structure&#10;Configure CI/CD&#10;Add authentication"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            One task per line
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Template
          </button>
          <a
            href="/templates"
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
