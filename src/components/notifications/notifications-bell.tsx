import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon } from "lucide-react";
import { useEffect, useRef } from "react";

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
import { $markAllNotificationsRead } from "#/lib/notifications/functions.ts";
import { notificationsQueryOptions, unreadCountQueryOptions } from "#/lib/notifications/queries.ts";

export function NotificationsBell() {
  const queryClient = useQueryClient();
  const { data: unread } = useQuery(unreadCountQueryOptions());
  const { data: items } = useQuery(notificationsQueryOptions());

  const listKey = notificationsQueryOptions().queryKey;

  // Notifications are written for the *other* party, so no mutation on this page can invalidate
  // them. The unread count is the only thing that polls; it is one integer, so it drives the list:
  // whenever it moves, something arrived, and the cached list is dropped.
  const polledUnread = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (unread === undefined) return;
    if (polledUnread.current !== undefined && polledUnread.current !== unread) {
      void queryClient.invalidateQueries({ queryKey: listKey });
    }
    polledUnread.current = unread;
  }, [unread, queryClient, listKey]);

  const { mutate: markAll } = useMutation({
    mutationFn: async () => await $markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <DropdownMenu
      // Opening the panel is the other moment the list can be behind: the count may not have
      // polled yet even though a notification has already been written.
      onOpenChange={(open) => {
        if (open) void queryClient.invalidateQueries({ queryKey: listKey });
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" />
        }
      >
        <BellIcon className="size-4" />
        {unread ? <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500" /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            Notifications
            {unread ? (
              <Button size="sm" variant="ghost" onClick={() => markAll()}>
                Mark all read
              </Button>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {items && items.length > 0 ? (
          items.slice(0, 8).map((n) => (
            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5">
              <span className="flex w-full items-center gap-2">
                {n.read ? null : (
                  <>
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-red-500"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Unread.</span>
                  </>
                )}
                <span className="text-sm font-medium">{n.title}</span>
              </span>
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
