import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";

export const runtime = "nodejs";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!prisma) {
    throw new Error("Database not connected");
  }

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    notFound();
  }

  async function updateProject(formData: FormData) {
    "use server";
    if (!prisma) throw new Error("Database not connected");

    const projectId = formData.get("projectId") as string;
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name: formData.get("name") as string,
        brand: (formData.get("brand") as string) || null,
        brief: (formData.get("brief") as string) || null,
      },
    });

    redirect(`/projects/${projectId}`);
  }

  async function deleteProject(formData: FormData) {
    "use server";
    if (!prisma) throw new Error("Database not connected");

    const projectId = formData.get("projectId") as string;
    await prisma.project.delete({ where: { id: projectId } });
    redirect("/board");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Project Settings</h1>

      <form action={updateProject} className="space-y-6 rounded-lg border border-border bg-card p-6">
        <input type="hidden" name="projectId" value={id} />
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Project Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={project.name}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-foreground">
            Brand / Client
          </label>
          <input
            type="text"
            id="brand"
            name="brand"
            defaultValue={project.brand ?? ""}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="brief" className="block text-sm font-medium text-foreground">
            Brief
          </label>
          <textarea
            id="brief"
            name="brief"
            rows={5}
            defaultValue={project.brief ?? ""}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save Changes
          </button>
          <Link
            href={`/projects/${id}`}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>

      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deleting a project cannot be undone.
        </p>
        <form action={deleteProject} className="mt-4">
          <input type="hidden" name="projectId" value={id} />
          <DeleteButton label="Delete Project" />
        </form>
      </div>
    </div>
  );
}
