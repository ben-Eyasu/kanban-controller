import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/ai";

const SYSTEM_PROMPT = `You are a project-scoping assistant. The user will describe a website idea in one or two sentences.
Ask at most 2-3 short clarifying questions (audience, must-have pages/features, any deadline).
Once you have enough, output a structured brief with these fields: goal, audience, key_pages, success_criteria.
Keep the whole exchange under 6 turns. Never invent specifics the user didn't imply.`;

export async function POST(request: Request) {
  const { projectId, messages, templateContext } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "Messages array required" }, { status: 400 });
  }

  // Build system message with optional template context
  let systemContent = SYSTEM_PROMPT;
  if (templateContext) {
    systemContent += `\n\nSelected template context: ${templateContext}`;
  }

  const allMessages = [
    { role: "system", content: systemContent },
    ...messages,
  ];

  try {
    const response = await chat(allMessages);

    // Store the exchange if projectId provided
    if (projectId && prisma) {
      for (const msg of messages) {
        if (msg.role === "user") {
          await prisma.aiMessage.create({
            data: { projectId, role: "user", content: msg.content },
          });
        }
      }
      await prisma.aiMessage.create({
        data: { projectId, role: "assistant", content: response },
      });
    }

    return Response.json({ content: response });
  } catch (error: any) {
    console.error("AI refine-brief error:", error);
    return Response.json({ error: "AI request failed" }, { status: 500 });
  }
}
