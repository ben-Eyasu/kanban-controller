import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/ai";

const SYSTEM_PROMPT = `You are a project assistant. Summarize the following activity log in 1-2 plain-language sentences. Focus on what changed and what it means for the project.`;

export async function POST(request: Request) {
  const { projectId } = await request.json();

  if (!projectId) {
    return Response.json({ error: "Project ID required" }, { status: 400 });
  }

  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }

  try {
    const events = await prisma.activityEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    if (events.length === 0) {
      return Response.json({ summary: "No activity yet." });
    }

    const activityLog = events
      .map((e: any) => {
        const payload = e.payload || {};
        switch (e.type) {
          case "push":
            return `Push: ${payload.commits?.length ?? 0} commit(s) to ${payload.ref?.replace("refs/heads/", "") ?? "unknown"}`;
          case "pull_request":
            return `PR #${payload.pull_request?.number}: ${payload.action}`;
          case "issues":
            return `Issue #${payload.issue?.number}: ${payload.action}`;
          case "deployment_status":
            return `Deployment: ${payload.deployment_status?.state ?? "unknown"}`;
          default:
            return e.type;
        }
      })
      .join("\n");

    const response = await chat([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: activityLog },
    ]);

    return Response.json({ summary: response });
  } catch (error: any) {
    console.error("AI summarize-activity error:", error);
    return Response.json({ error: "AI request failed" }, { status: 500 });
  }
}
