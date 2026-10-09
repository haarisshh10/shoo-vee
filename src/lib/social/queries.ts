import { queryOptions } from "@tanstack/react-query";

import {
  $getCreatorSocialCounts,
  $getFollowingFeed,
  $getMySocialIds,
  $getSavedCreators,
} from "./functions";

export const mySocialIdsQueryOptions = () =>
  queryOptions({
    queryKey: ["social", "ids"],
    queryFn: ({ signal }) => $getMySocialIds({ signal }),
  });

export const creatorSocialCountsQueryOptions = (creatorId: string) =>
  queryOptions({
    queryKey: ["social", "counts", creatorId],
    queryFn: ({ signal }) => $getCreatorSocialCounts({ data: { creatorId }, signal }),
  });

export const savedCreatorsQueryOptions = () =>
  queryOptions({
    queryKey: ["social", "saved"],
    queryFn: ({ signal }) => $getSavedCreators({ signal }),
  });

export const followingFeedQueryOptions = () =>
  queryOptions({
    queryKey: ["social", "following-feed"],
    queryFn: ({ signal }) => $getFollowingFeed({ data: {}, signal }),
  });
