import { queryOptions } from "@tanstack/react-query";

import { $getGigById, $getGigs, $getMyApplications, $getMyGigs } from "./functions";

export const gigsQueryOptions = () =>
  queryOptions({
    queryKey: ["gigs", "list"],
    queryFn: ({ signal }) => $getGigs({ data: {}, signal }),
  });

export const gigQueryOptions = (gigId: string) =>
  queryOptions({
    queryKey: ["gigs", gigId],
    queryFn: ({ signal }) => $getGigById({ data: { gigId }, signal }),
  });

export const myGigsQueryOptions = () =>
  queryOptions({
    queryKey: ["gigs", "me"],
    queryFn: ({ signal }) => $getMyGigs({ signal }),
  });

export const myApplicationsQueryOptions = () =>
  queryOptions({
    queryKey: ["gigs", "applications", "me"],
    queryFn: ({ signal }) => $getMyApplications({ signal }),
  });
