import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }

  const { projectId } = await request.json();

  if (!projectId) {
    return Response.json({ error: "Project ID required" }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { portfolioEntry: true },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.portfolioEntry) {
      return Response.json({ error: "Project already published" }, { status: 400 });
    }

    // Generate a URL-safe slug from the project name
    const slug = project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 60);

    const entry = await prisma.portfolioEntry.create({
      data: {
        projectId,
        publicSlug: slug,
        isPublic: true,
      },
    });

    revalidatePath("/portfolio");

    return Response.json(entry);
  } catch (error: any) {
    console.error("Publish portfolio error:", error);
    return Response.json({ error: error.message ?? "Failed to publish" }, { status: 500 });
  }
}
