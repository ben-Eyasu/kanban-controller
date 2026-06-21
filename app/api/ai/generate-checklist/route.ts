import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/ai";

const SYSTEM_PROMPT = `You are a project planning assistant. Given a project brief, generate a starter checklist of 5-10 concrete tasks. Return one task per line, starting with "- ".`;

export async function POST(request: Request) {
  const { brief } = await request.json();

  if (!brief) {
    return Response.json({ error: "Brief text required" }, { status: 400 });
  }

  try {
    const response = await chat([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: brief },
    ]);

    const tasks = response
      .split("\n")
      .filter((line: string) => line.trim().startsWith("- "))
      .map((line: string) => line.replace(/^- /, "").trim());

    return Response.json({ tasks });
  } catch (error: any) {
    console.error("AI generate-checklist error:", error);
    return Response.json({ error: "AI request failed" }, { status: 500 });
  }
}
