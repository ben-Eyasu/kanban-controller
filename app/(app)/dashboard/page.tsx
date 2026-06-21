import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await auth();

  let workspaceName = "your workspace";

  if (prisma && session) {
    try {
      const membership = await prisma.workspaceMember.findFirst({
        where: { userId: (session as any).user?.id },
        include: { workspace: true },
      });
      workspaceName = membership?.workspace?.name ?? workspaceName;
    } catch {
      // Database not connected yet — use default
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to{" "}
        <span className="text-foreground">{workspaceName}</span>.
      </p>
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          No projects yet. Create your first project to get started.
        </p>
      </div>
    </div>
  );
}
