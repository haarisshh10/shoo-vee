import { queryOptions } from "@tanstack/react-query";

import { $getMyInterests } from "./functions";

export const myInterestsQueryOptions = () =>
  queryOptions({
    queryKey: ["onboarding", "interests"],
    queryFn: ({ signal }) => $getMyInterests({ signal }),
  });
