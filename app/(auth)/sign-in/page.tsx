import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const hasGithubCreds = !!(
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
);

export default async function SignInPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8">
        <h1 className="text-center text-2xl font-bold text-foreground">
          Kanban Controller
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          Sign in to manage your projects
        </p>
        {hasGithubCreds ? (
          <form action="/api/auth/signin/github" method="POST">
            <input type="hidden" name="callbackUrl" value="/dashboard" />
            <button
              type="submit"
              className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              Sign in with GitHub
            </button>
          </form>
        ) : (
          <div className="rounded-md border border-border bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              GitHub sign-in is not configured.
              <br />
              Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to your environment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
