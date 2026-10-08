import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  ApertureIcon,
  BriefcaseIcon,
  CalendarIcon,
  CameraIcon,
  ClapperboardIcon,
  CompassIcon,
  GalleryVerticalEndIcon,
  ImageIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  StoreIcon,
  UserRoundIcon,
  WrenchIcon,
} from "lucide-react";

import { AccountMenu } from "#/components/account-menu.tsx";
import { NotificationsBell } from "#/components/notifications/notifications-bell.tsx";
import { ThemeToggle } from "#/components/theme-toggle.tsx";
import { buttonVariants } from "#/components/ui/button.tsx";
import { useAuth } from "#/lib/auth/hooks.ts";
import { myCreatorProfileQueryOptions } from "#/lib/creators/queries.ts";

export const Route = createFileRoute("/_auth/app")({
  component: AppLayout,
});

const MARKETPLACE_NAV = [
  { to: "/discover", label: "Discover", icon: CompassIcon },
  { to: "/shots", label: "Shots", icon: ApertureIcon },
  { to: "/gigs", label: "Gigs", icon: BriefcaseIcon },
  { to: "/app/bookings", label: "Bookings", icon: CalendarIcon },
  { to: "/app/messages", label: "Messages", icon: MessageSquareIcon },
] as const;

/** Studio only appears once a creator profile exists; activation is a single step away. */
const STUDIO_NAV = [
  { to: "/app/studio", label: "Overview", icon: LayoutDashboardIcon, exact: true },
  { to: "/app/profile/creator", label: "Creator profile", icon: UserRoundIcon },
  { to: "/app/portfolio", label: "Portfolio", icon: ImageIcon },
  { to: "/app/services", label: "Services", icon: StoreIcon },
  { to: "/app/equipment", label: "Equipment", icon: WrenchIcon },
  { to: "/app/posts", label: "Posts", icon: CameraIcon },
  { to: "/app/bookings", label: "Bookings", icon: CalendarIcon },
  { to: "/app/gigs", label: "Gigs", icon: ClapperboardIcon },
] as const;

function AppLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  // Creator Profile activation is what unlocks Studio. Until it exists, the marketplace is home.
  const { data: profile } = useQuery(myCreatorProfileQueryOptions());
  const isCreator = !!profile;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/app" className="flex items-center gap-2 font-semibold tracking-tight">
            <GalleryVerticalEndIcon className="size-5" aria-hidden="true" />
            Sho-vee
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {MARKETPLACE_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                active={pathname === item.to || pathname.startsWith(`${item.to}/`)}
              />
            ))}
            {isCreator ? (
              <Link
                to="/app/studio"
                className="ms-2 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:border-foreground/30"
                activeProps={{ className: "bg-foreground text-background" }}
              >
                Studio
              </Link>
            ) : null}
          </nav>

          <div className="flex items-center gap-1.5">
            <NotificationsBell />
            <ThemeToggle />
            <AccountMenu
              name={user?.name}
              isAdmin={(user as { role?: string } | null | undefined)?.role === "admin"}
              hasCreatorProfile={isCreator}
            />
          </div>
        </div>

        {/* Phone navigation: the marketplace links, then Studio once it is unlocked. */}
        <nav className="flex gap-1 overflow-x-auto border-t px-4 py-2 text-sm md:hidden">
          {MARKETPLACE_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="shrink-0 rounded-full px-3 py-1.5 text-muted-foreground"
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
            >
              {item.label}
            </Link>
          ))}
          {isCreator ? (
            <Link to="/app/studio" className="shrink-0 rounded-full border px-3 py-1.5 font-medium">
              Studio
            </Link>
          ) : null}
        </nav>
      </header>

      {isCreator && pathname.startsWith("/app/studio") ? <StudioNav pathname={pathname} /> : null}

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof CompassIcon;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

function StudioNav({ pathname }: { pathname: string }) {
  return (
    <div className="border-b bg-card/40">
      <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 py-2">
        {STUDIO_NAV.map((item) => {
          const active = "exact" in item ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Shared prompt shown wherever a signed-in user without a profile lands in Studio territory. */
export function CreatorActivationPrompt({ reason }: { reason?: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
      <h2 className="text-xl font-semibold tracking-tight">Create your creator profile</h2>
      <p className="text-sm text-muted-foreground">
        {reason ??
          "Activate a creator profile to publish a portfolio, list services and start taking bookings. You keep the same single Sho-vee account."}
      </p>
      <Link to="/app/profile/creator" className={buttonVariants()}>
        Create your creator profile
      </Link>
    </div>
  );
}
