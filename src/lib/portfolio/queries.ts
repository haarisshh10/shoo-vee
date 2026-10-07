import { queryOptions } from "@tanstack/react-query";

import { $getMyPortfolioItems, $getPortfolioByCreatorId } from "./functions";

export const myPortfolioQueryOptions = () =>
  queryOptions({
    queryKey: ["portfolio", "me"],
    queryFn: ({ signal }) => $getMyPortfolioItems({ signal }),
  });

export const creatorPortfolioQueryOptions = (creatorId: string) =>
  queryOptions({
    queryKey: ["portfolio", "creator", creatorId],
    queryFn: ({ signal }) => $getPortfolioByCreatorId({ data: { creatorId }, signal }),
  });
