export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8">
        <h1 className="text-center text-2xl font-bold text-foreground">
          Kanban Controller
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          Sign in to manage your projects
        </p>
        <div className="rounded-md border border-border bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Auth setup requires a database connection.
            <br />
            Connect a Neon database to enable sign-in.
          </p>
        </div>
      </div>
    </div>
  );
}
