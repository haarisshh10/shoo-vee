import { queryOptions } from "@tanstack/react-query";

import { $getMyReviewableBookings } from "./functions";

export const reviewableQueryOptions = () =>
  queryOptions({
    queryKey: ["reviews", "reviewable"],
    queryFn: ({ signal }) => $getMyReviewableBookings({ signal }),
  });
