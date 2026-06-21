import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const WEBHOOK_SECRET = process.env.GITHUB_APP_WEBHOOK_SECRET;

async function verifySignature(body: string, signature: string | null): Promise<boolean> {
  if (!WEBHOOK_SECRET || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedSignature = "sha256=" + Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expectedSignature;
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("x-hub-signature-256");
  const deliveryId = headersList.get("x-github-delivery");
  const event = headersList.get("x-github-event");

  // Verify HMAC signature
  if (!(await verifySignature(body, signature))) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Parse payload
  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Extract repo full name
  const repoFullName = payload.repository?.full_name;
  if (!repoFullName) {
    return new Response("No repository in payload", { status: 400 });
  }

  // Find project by repo
  if (!prisma) {
    return new Response("Database not connected", { status: 503 });
  }

  const project = await prisma.project.findFirst({
    where: { githubRepoFullName: repoFullName },
  });

  if (!project) {
    // No matching project — acknowledge but don't process
    return new Response("OK", { status: 200 });
  }

  // Handle event types
  try {
    switch (event) {
      case "push":
        await prisma.activityEvent.create({
          data: {
            projectId: project.id,
            source: "github",
            type: "push",
            deliveryId: deliveryId || crypto.randomUUID(),
            payload,
          },
        });
        break;

      case "pull_request":
        await prisma.activityEvent.create({
          data: {
            projectId: project.id,
            source: "github",
            type: "pull_request",
            deliveryId: deliveryId || crypto.randomUUID(),
            payload,
          },
        });
        break;

      case "issues":
        await prisma.activityEvent.create({
          data: {
            projectId: project.id,
            source: "github",
            type: "issues",
            deliveryId: deliveryId || crypto.randomUUID(),
            payload,
          },
        });
        break;

      case "deployment_status":
        await prisma.activityEvent.create({
          data: {
            projectId: project.id,
            source: "github",
            type: "deployment_status",
            deliveryId: deliveryId || crypto.randomUUID(),
            payload,
          },
        });
        break;

      default:
        // Unhandled event type — acknowledge
        break;
    }
  } catch (error: any) {
    // Duplicate delivery ID — already processed (idempotent)
    if (error.code === "P2002") {
      return new Response("OK", { status: 200 });
    }
    console.error("Webhook processing error:", error);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
