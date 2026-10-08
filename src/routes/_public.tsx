import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { GalleryVerticalEndIcon } from "lucide-react";

import { ThemeToggle } from "#/components/theme-toggle.tsx";
import { buttonVariants } from "#/components/ui/button.tsx";
import { useAuth } from "#/lib/auth/hooks.ts";
import { cn } from "#/lib/utils.ts";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

const NAV = [
  { to: "/discover", label: "Discover" },
  { to: "/shots", label: "Shots" },
  { to: "/gigs", label: "Gigs" },
  { to: "/creators", label: "Creators" },
] as const;

function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <GalleryVerticalEndIcon className="size-5" aria-hidden="true" />
            Sho-vee
          </Link>

          <div className="hidden items-center gap-6 text-sm md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link to="/app" className={buttonVariants({ size: "sm" })}>
                My Sho-vee
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "hidden sm:inline-flex",
                  )}
                >
                  Sign in
                </Link>
                <Link to="/signup" className={buttonVariants({ size: "sm" })}>
                  Join
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Compact row for phones, where the desktop links do not fit. */}
        <nav className="flex gap-4 overflow-x-auto border-t px-4 py-2 text-sm md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="shrink-0 text-muted-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Sho-vee — the marketplace for visual creators.</p>
          <p className="text-xs">Discover · Shots · Gigs · Creators</p>
        </div>
      </footer>
    </div>
  );
}
