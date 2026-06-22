import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }

  const { name, brand, description, templateId } = await request.json();

  if (!name || !name.trim()) {
    return Response.json({ error: "Project name is required" }, { status: 400 });
  }

  try {
    // Get the first workspace
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      return Response.json({ error: "No workspace found. Seed the database first." }, { status: 400 });
    }

    // Get the first stage (backlog)
    const stage = await prisma.stage.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { order: "asc" },
    });

    const project = await prisma.project.create({
      data: {
        workspaceId: workspace.name ? workspace.id : workspace.id,
        name: name.trim(),
        brand: brand?.trim() || null,
        brief: description?.trim() || null,
        stageId: stage?.id ?? "",
        templateId: templateId || null,
      },
    });

    revalidatePath("/board");
    revalidatePath("/dashboard");

    return Response.json(project);
  } catch (error: any) {
    console.error("Create project error:", error);
    return Response.json({ error: error.message ?? "Failed to create project" }, { status: 500 });
  }
}
