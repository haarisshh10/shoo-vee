import { queryOptions } from "@tanstack/react-query";

import { $getMyServices, $getServicesByCreatorId } from "./functions";

export const myServicesQueryOptions = () =>
  queryOptions({
    queryKey: ["services", "me"],
    queryFn: ({ signal }) => $getMyServices({ signal }),
  });

export const creatorServicesQueryOptions = (creatorId: string) =>
  queryOptions({
    queryKey: ["services", "creator", creatorId],
    queryFn: ({ signal }) => $getServicesByCreatorId({ data: { creatorId }, signal }),
  });
