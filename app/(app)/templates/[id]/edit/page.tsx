import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";

export const runtime = "nodejs";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!prisma) {
    throw new Error("Database not connected");
  }

  const template = await prisma.template.findUnique({
    where: { id },
  });

  if (!template) {
    notFound();
  }

  const checklist = ((template.defaultChecklist as string[]) ?? []).join("\n");

  async function updateTemplate(formData: FormData) {
    "use server";

    if (!prisma) throw new Error("Database not connected");

    const templateId = formData.get("templateId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const templateRepoFullName = formData.get("templateRepoFullName") as string;
    const defaultStack = formData.get("defaultStack") as string;
    const checklistRaw = formData.get("defaultChecklist") as string;

    if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(templateRepoFullName)) {
      throw new Error("Invalid repository format. Expected: owner/repo");
    }

    const defaultChecklist = checklistRaw
      ? checklistRaw.split("\n").filter((line) => line.trim())
      : [];

    await prisma.template.update({
      where: { id: templateId },
      data: {
        name,
        description: description || null,
        templateRepoFullName,
        defaultStack: defaultStack || null,
        defaultChecklist: defaultChecklist.length > 0 ? defaultChecklist : undefined,
      },
    });

    redirect(`/templates/${templateId}`);
  }

  async function deleteTemplate(formData: FormData) {
    "use server";

    if (!prisma) throw new Error("Database not connected");

    const templateId = formData.get("templateId") as string;
    await prisma.template.delete({
      where: { id: templateId },
    });

    redirect("/templates");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Edit Template</h1>

      <form action={updateTemplate} className="space-y-6 rounded-lg border border-border bg-card p-6">
        <input type="hidden" name="templateId" value={id} />
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={template.name}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            defaultValue={template.description ?? ""}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            defaultValue={template.templateRepoFullName}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="defaultStack" className="block text-sm font-medium text-foreground">
            Default Stack
          </label>
          <input
            type="text"
            id="defaultStack"
            name="defaultStack"
            defaultValue={template.defaultStack ?? ""}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            defaultValue={checklist}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save Changes
          </button>
          <a
            href={`/templates/${id}`}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </a>
        </div>
      </form>

      <form action={deleteTemplate}>
        <input type="hidden" name="templateId" value={id} />
        <DeleteButton label="Delete Template" />
      </form>
    </div>
  );
}
