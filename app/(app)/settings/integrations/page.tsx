import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export default async function IntegrationsPage() {
  let integration: any = null;

  if (prisma) {
    try {
      integration = await prisma.integration.findFirst({
        where: { type: "github_app" },
      });
    } catch {
      // Database not connected
    }
  }

  const isConnected = !!integration;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Integrations</h1>

      {/* GitHub App */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <svg className="h-5 w-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">GitHub</h2>
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? `Connected (Installation ID: ${integration.installationId})`
                  : "Connect your GitHub account to enable automation"}
              </p>
            </div>
          </div>
          {isConnected ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Connected
            </span>
          ) : (
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              Not connected
            </span>
          )}
        </div>

        {!isConnected && (
          <div className="mt-4 rounded-md border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              To connect GitHub:
            </p>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create a GitHub App at github.com/settings/apps</li>
              <li>Set permissions: Contents (read/write), Administration (read/write), Issues (read), Pull requests (read), Deployments (read)</li>
              <li>Subscribe to webhook events: push, pull_request, issues, deployment_status</li>
              <li>Install the app on your account</li>
              <li>Add the credentials to your .env.local file</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
