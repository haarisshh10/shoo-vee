import { queryOptions } from "@tanstack/react-query";

import { $adminListReports } from "./functions";

export const adminReportsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "reports"],
    queryFn: ({ signal }) => $adminListReports({ data: { status: "open" }, signal }),
  });
