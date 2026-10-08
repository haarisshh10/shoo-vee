import { queryOptions } from "@tanstack/react-query";

import {
  $getFeaturedCreators,
  $getPopularCategories,
  $searchCreators,
  type CreatorSearch,
} from "./functions";

export const searchCreatorsQueryOptions = (filters: CreatorSearch) =>
  queryOptions({
    queryKey: ["creators", "search", filters],
    queryFn: ({ signal }) => $searchCreators({ data: filters, signal }),
  });

export const featuredCreatorsQueryOptions = (limit = 8) =>
  queryOptions({
    queryKey: ["creators", "featured", limit],
    queryFn: ({ signal }) => $getFeaturedCreators({ data: { limit }, signal }),
  });

export const popularCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["creators", "categories"],
    queryFn: ({ signal }) => $getPopularCategories({ signal }),
    // Counts move slowly; there is no reason to recompute them on every focus.
    staleTime: "static",
  });
