import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }

  const projectId = params.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { template: true, workspace: true },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.template) {
      return Response.json({ error: "No template assigned to this project" }, { status: 400 });
    }

    // Move project to "In development" stage
    const inDevStage = await prisma.stage.findFirst({
      where: {
        workspaceId: project.workspaceId,
        name: { contains: "dev", mode: "insensitive" },
      },
    });

    if (inDevStage) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          stageId: inDevStage.id,
          startedAt: new Date(),
        },
      });
    }

    // Create default checklist tasks from template
    const checklist = project.template.defaultChecklist as string[] | null;
    if (checklist && checklist.length > 0) {
      await prisma.task.createMany({
        data: checklist.map((title) => ({
          projectId,
          title,
          source: "template",
        })),
      });
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/board");

    return Response.json({ ok: true });
  } catch (error: any) {
    console.error("Start project error:", error);
    return Response.json({ error: error.message ?? "Failed to start project" }, { status: 500 });
  }
}
