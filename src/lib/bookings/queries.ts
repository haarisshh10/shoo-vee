import { queryOptions } from "@tanstack/react-query";

import { $getMyCreatorBookings, $getMyCustomerBookings } from "./functions";

export const myCustomerBookingsQueryOptions = () =>
  queryOptions({
    queryKey: ["bookings", "customer"],
    queryFn: ({ signal }) => $getMyCustomerBookings({ signal }),
  });

export const myCreatorBookingsQueryOptions = () =>
  queryOptions({
    queryKey: ["bookings", "creator"],
    queryFn: ({ signal }) => $getMyCreatorBookings({ signal }),
  });
