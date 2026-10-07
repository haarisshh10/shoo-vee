import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Button } from "#/components/ui/button.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { $adminResolveReport } from "#/lib/reports/functions.ts";
import { adminReportsQueryOptions } from "#/lib/reports/queries.ts";

export const Route = createFileRoute("/admin/reports/")({
  component: AdminReportsPage,
});

function AdminReportsPage() {
  const queryClient = useQueryClient();
  const reports = useQuery(adminReportsQueryOptions());

  const { mutate: resolve } = useMutation({
    mutationFn: async (data: { reportId: string; status: "reviewed" | "dismissed" }) =>
      await $adminResolveReport({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      toast.add({ type: "success", description: "Report updated." });
    },
    onError: () => toast.add({ type: "error", description: "Failed." }),
  });

  if (reports.isError) {
    return (
      <p className="p-10 text-sm text-muted-foreground">Not authorized. Admin access required.</p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Reports</h1>
      {reports.data && reports.data.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {reports.data.map(({ report: r, reporter }) => (
            <li key={r.id} className="rounded-md border p-4">
              <p className="text-sm font-medium">
                {r.targetType} · {r.targetId.slice(0, 8)}
              </p>
              <p className="text-sm text-muted-foreground">{r.reason}</p>
              <p className="text-xs text-muted-foreground">
                reported by {reporter.email} · {r.createdAt.toLocaleDateString()}
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => resolve({ reportId: r.id, status: "reviewed" })}>
                  Mark reviewed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolve({ reportId: r.id, status: "dismissed" })}
                >
                  Dismiss
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No open reports.</p>
      )}
    </div>
  );
}
