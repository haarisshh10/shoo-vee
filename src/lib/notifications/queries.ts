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
  });
