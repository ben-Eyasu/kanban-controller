import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

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
        <form
          action={async () => {
            "use server";
            await signIn("github", { callbackUrl: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Sign in with GitHub
          </button>
        </form>
      </div>
    </div>
  );
}
