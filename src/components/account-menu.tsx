import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { LogOutIcon, ShieldIcon, UserRoundIcon } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu.tsx";
import { authClient } from "#/lib/auth/auth-client.ts";
import { authQueryOptions } from "#/lib/auth/queries.ts";

/**
 * Account menu for signed-in surfaces.
 *
 * The admin console lives here rather than in the marketplace navigation: admin is a permission,
 * not a place everyone should have to see.
 */
export function AccountMenu({
  name,
  isAdmin,
  hasCreatorProfile,
}: {
  name: string | null | undefined;
  isAdmin: boolean;
  hasCreatorProfile: boolean;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onResponse: async () => {
          // manually set to null to avoid unnecessary refetching
          queryClient.setQueryData(authQueryOptions().queryKey, null);
          await router.invalidate();
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Account" />}>
        <span className="grid size-6 place-items-center rounded-full bg-muted text-xs font-semibold uppercase">
          {name?.slice(0, 1) ?? "?"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate normal-case">{name}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.navigate({ to: "/app/profile/creator" })}>
          <UserRoundIcon aria-hidden="true" />
          {hasCreatorProfile ? "Edit creator profile" : "Become a creator"}
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem onClick={() => router.navigate({ to: "/admin" })}>
            <ShieldIcon aria-hidden="true" />
            Admin console
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={signOut}>
          <LogOutIcon aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
