import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { useAuth } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Sho-vee
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/discover" className="hover:underline">
              Discover
            </Link>
            <Link to="/shots" className="hover:underline">
              Shots
            </Link>
            <Link to="/gigs" className="hover:underline">
              Gigs
            </Link>
            {user ? (
              <Link to="/app" className="hover:underline">
                App
              </Link>
            ) : (
              <Link to="/login" className="hover:underline">
                Log in
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
