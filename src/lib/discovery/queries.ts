import { queryOptions } from "@tanstack/react-query";

import { $searchCreators, type CreatorSearch } from "./functions";

export const searchCreatorsQueryOptions = (filters: CreatorSearch) =>
  queryOptions({
    queryKey: ["creators", "search", filters],
    queryFn: ({ signal }) => $searchCreators({ data: filters, signal }),
  });
