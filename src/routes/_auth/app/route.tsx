import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  BriefcaseIcon,
  CalendarIcon,
  CameraIcon,
  ImageIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  ShieldIcon,
  VideoIcon,
  WrenchIcon,
} from "lucide-react";

import { NotificationsBell } from "#/components/notifications/notifications-bell.tsx";
import { SignOutButton } from "#/components/sign-out-button.tsx";
import { ThemeToggle } from "#/components/theme-toggle.tsx";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "#/components/ui/sidebar.tsx";
import { useAuth } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app")({
  component: AppLayout,
});

const NAV = [
  { to: "/app", label: "Overview", icon: LayoutDashboardIcon, exact: true },
  { to: "/app/profile/creator", label: "Creator profile", icon: Settings2Icon },
  { to: "/app/portfolio", label: "Portfolio", icon: ImageIcon },
  { to: "/app/services", label: "Services", icon: BriefcaseIcon },
  { to: "/app/equipment", label: "Equipment", icon: WrenchIcon },
  { to: "/app/posts", label: "Posts", icon: CameraIcon },
  { to: "/app/bookings", label: "Bookings", icon: CalendarIcon },
  { to: "/app/gigs", label: "Gigs", icon: VideoIcon },
] as const;

function AppLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isAdmin = (user as { role?: string } | null | undefined)?.role === "admin";

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link to="/" className="px-2 text-sm font-semibold tracking-tight">
            Sho-vee
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Studio</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map(({ to, label, icon: Icon, ...rest }) => {
                  const exact = "exact" in rest && rest.exact;
                  const isActive = exact ? pathname === to : pathname.startsWith(to);
                  return (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton
                        render={<Link to={to} />}
                        isActive={isActive}
                        tooltip={label}
                      >
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link to="/admin" />}
                      isActive={pathname.startsWith("/admin")}
                      tooltip="Admin"
                    >
                      <ShieldIcon aria-hidden="true" />
                      <span>Admin</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center justify-between border-b px-4 py-2">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
