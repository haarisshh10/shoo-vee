import { queryOptions } from "@tanstack/react-query";

import { $getEquipmentByCreatorId, $getMyEquipment } from "./functions";

export const myEquipmentQueryOptions = () =>
  queryOptions({
    queryKey: ["equipment", "me"],
    queryFn: ({ signal }) => $getMyEquipment({ signal }),
  });

export const creatorEquipmentQueryOptions = (creatorId: string) =>
  queryOptions({
    queryKey: ["equipment", "creator", creatorId],
    queryFn: ({ signal }) => $getEquipmentByCreatorId({ data: { creatorId }, signal }),
  });
