import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu.tsx";
import { $markAllNotificationsRead } from "#/lib/notifications/functions.ts";
import { notificationsQueryOptions, unreadCountQueryOptions } from "#/lib/notifications/queries.ts";

export function NotificationsBell() {
  const queryClient = useQueryClient();
  const { data: unread } = useQuery(unreadCountQueryOptions());
  const { data: items } = useQuery(notificationsQueryOptions());

  const { mutate: markAll } = useMutation({
    mutationFn: async () => await $markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" />
        }
      >
        <BellIcon className="size-4" />
        {unread ? <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500" /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unread ? (
            <Button size="sm" variant="ghost" onClick={() => markAll()}>
              Mark all read
            </Button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items && items.length > 0 ? (
          items.slice(0, 8).map((n) => (
            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium">{n.title}</span>
              {n.body && (
                <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
              )}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No notifications yet.</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
