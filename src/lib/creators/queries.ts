import { queryOptions } from "@tanstack/react-query";

import { $getMyCreatorProfile } from "./functions";

export const myCreatorProfileQueryOptions = () =>
  queryOptions({
    queryKey: ["creator-profile", "me"],
    queryFn: ({ signal }) => $getMyCreatorProfile({ signal }),
  });
