import { queryOptions } from "@tanstack/react-query";

import { $getUnreadCount, $listNotifications } from "./functions";

export const notificationsQueryOptions = () =>
  queryOptions({
    queryKey: ["notifications", "list"],
    queryFn: ({ signal }) => $listNotifications({ signal }),
  });

export const unreadCountQueryOptions = () =>
  queryOptions({
    queryKey: ["notifications", "unread"],
    queryFn: ({ signal }) => $getUnreadCount({ signal }),
    refetchInterval: 30_000,
    // The app-wide staleTime is two minutes, so a plain focus refetch would skip a user who comes
    // back to the tab after ten seconds. The count is one indexed integer; always revalidate it.
    refetchOnWindowFocus: "always",
  });
