import { queryOptions } from "@tanstack/react-query";

import { $adminListCreators, $adminListGigs, $adminListPosts } from "./functions";

export const adminCreatorsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "creators"],
    queryFn: ({ signal }) => $adminListCreators({ signal }),
  });

export const adminPostsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "posts"],
    queryFn: ({ signal }) => $adminListPosts({ signal }),
  });

export const adminGigsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "gigs"],
    queryFn: ({ signal }) => $adminListGigs({ signal }),
  });
