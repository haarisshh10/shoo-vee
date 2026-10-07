import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "#/components/ui/button.tsx";
import { toast } from "#/components/ui/toast.tsx";
import type { ReportTargetType } from "#/lib/db/schema/report.schema.ts";
import { $createReport } from "#/lib/reports/functions.ts";

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: ReportTargetType;
  targetId: string;
}) {
  const [done, setDone] = useState(false);
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { targetType: ReportTargetType; targetId: string; reason: string }) =>
      await $createReport({ data }),
    onSuccess: () => {
      setDone(true);
      toast.add({ type: "success", description: "Thanks — we'll review this." });
    },
    onError: (error) =>
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Could not submit report.",
      }),
  });

  if (done) return <span className="text-xs text-muted-foreground">Reported</span>;

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() => {
        const reason = window.prompt("Why are you reporting this?");
        if (reason && reason.trim()) {
          mutate({ targetType, targetId, reason: reason.trim() });
        }
      }}
    >
      Report
    </Button>
  );
}
