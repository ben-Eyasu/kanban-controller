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

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const repoFullName = payload.repository?.full_name;
  if (!repoFullName) {
    return new Response("No repository in payload", { status: 400 });
  }

  if (!prisma) {
    return new Response("Database not connected", { status: 503 });
  }

  const project = await prisma.project.findFirst({
    where: { githubRepoFullName: repoFullName },
  });

  if (!project) {
    return new Response("OK", { status: 200 });
  }

  try {
    switch (event) {
      case "push":
      case "pull_request":
      case "issues": {
        await prisma.activityEvent.create({
          data: {
            projectId: project.id,
            source: "github",
            type: event,
            deliveryId: deliveryId || crypto.randomUUID(),
            payload,
          },
        });
        break;
      }

      case "deployment_status": {
        const deployment = payload.deployment;
        const deploymentStatus = payload.deployment_status;

        // Best-effort provider detection
        const provider = deployment?.creator?.login?.includes("vercel")
          ? "vercel"
          : deployment?.creator?.login?.includes("netlify")
          ? "netlify"
          : deployment?.task?.includes("render")
          ? "render"
          : null;

        // Write activity event
        await prisma.activityEvent.create({
          data: {
            projectId: project.id,
            source: "github",
            type: "deployment_status",
            deliveryId: deliveryId || crypto.randomUUID(),
            payload,
          },
        });

        // Write deployment record
        if (deployment && deploymentStatus) {
          await prisma.deployment.create({
            data: {
              projectId: project.id,
              environment: deployment.environment || "preview",
              url: deploymentStatus.target_url || deploymentStatus.environment_url || "",
              status: deploymentStatus.state || "pending",
              provider,
            },
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (error: any) {
    if (error.code === "P2002") {
      return new Response("OK", { status: 200 });
    }
    console.error("Webhook processing error:", error);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
