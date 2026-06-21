// OpenRouter AI client wrapper
// Uses OpenAI-compatible API endpoint — works with free models like openrouter/owl-alpha
// Docs: https://openrouter.ai/docs

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openrouter/owl-alpha";

export async function chat(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  model: string = DEFAULT_MODEL
): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "Kanban Project Controller",
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content ?? "";
}

// Phase 8: Brief refinement
export async function refineBrief(idea: string, templateContext?: string): Promise<string> {
  const systemPrompt = `You are a project-scoping assistant. The user will describe a website idea in one or two sentences.
Ask at most 2-3 short clarifying questions (audience, must-have pages/features, any deadline).
Once you have enough, output a structured brief with these fields: goal, audience, key_pages, success_criteria.
Keep the whole exchange under 6 turns. Never invent specifics the user didn't imply.`;

  const context = templateContext
    ? `\n\nSelected template context: ${templateContext}`
    : "";

  return chat([
    { role: "system", content: systemPrompt },
    { role: "user", content: idea + context },
  ]);
}

// Phase 8: Checklist generation
export async function generateChecklist(brief: string): Promise<string[]> {
  const systemPrompt = `You are a project planning assistant. Given a project brief, generate a starter checklist of 5-10 concrete tasks. Return one task per line, starting with "- ".`;

  const response = await chat([
    { role: "system", content: systemPrompt },
    { role: "user", content: brief },
  ]);

  return response
    .split("\n")
    .filter((line) => line.trim().startsWith("- "))
    .map((line) => line.replace(/^- /, "").trim());
}

// Phase 8: Activity summarization
export async function summarizeActivity(activityLog: string): Promise<string> {
  const systemPrompt = `You are a project assistant. Summarize the following activity log in 1-2 plain-language sentences. Focus on what changed and what it means for the project.`;

  return chat([
    { role: "system", content: systemPrompt },
    { role: "user", content: activityLog },
  ]);
}
