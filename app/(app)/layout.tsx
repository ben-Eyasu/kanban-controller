import Link from "next/link";
import { auth } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/board", label: "Board" },
  { href: "/templates", label: "Templates" },
  { href: "/settings/integrations", label: "Settings" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth() as any;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-card">
        <div className="p-4">
          <Link href="/dashboard" className="text-lg font-bold text-foreground">
            Kanban Controller
          </Link>
        </div>
        <nav className="mt-4 space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border px-6">
          <span className="text-sm text-muted-foreground">
            {session?.user?.name ?? session?.user?.email ?? "Guest"}
          </span>
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
