import { queryOptions } from "@tanstack/react-query";

import { $getFeed, $getMyPosts } from "./functions";

export const feedQueryOptions = () =>
  queryOptions({
    queryKey: ["posts", "feed"],
    queryFn: ({ signal }) => $getFeed({ data: {}, signal }),
  });

export const myPostsQueryOptions = () =>
  queryOptions({
    queryKey: ["posts", "me"],
    queryFn: ({ signal }) => $getMyPosts({ signal }),
  });
