import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircleIcon } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { useAuth } from "#/lib/auth/hooks.ts";
import { $transitionGigApplication } from "#/lib/gigs/functions.ts";
import { gigQueryOptions } from "#/lib/gigs/queries.ts";

export const Route = createFileRoute("/_auth/app/gigs/$gigId")({
  component: GigDetailPage,
});

function GigDetailPage() {
  const { gigId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isPending, isError } = useQuery(gigQueryOptions(gigId));

  const { mutate: transition, isPending: isUpdating } = useMutation({
    mutationFn: async (data: { applicationId: string; action: "accept" | "reject" }) =>
      await $transitionGigApplication({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gigs"] });
      toast.add({ type: "success", description: "Application updated." });
    },
    onError: (error) =>
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Could not update application.",
      }),
  });

  if (isPending) return <LoaderCircleIcon className="animate-spin" aria-hidden="true" />;
  if (isError || !data) return <p className="text-sm text-muted-foreground">Gig not found.</p>;

  const { gig, poster, applications } = data;
  const isPoster = user?.id === poster.id;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">{gig.title}</h1>
        <p className="text-sm text-muted-foreground">
          {gig.roleNeeded}
          {gig.location ? ` · ${gig.location}` : ""}
          {gig.date ? ` · ${gig.date.toLocaleDateString()}` : ""}
          {` · posted by ${poster.name}`}
        </p>
        {gig.pay !== null && (
          <p className="mt-1 font-medium">
            {gig.currency} {gig.pay.toLocaleString("en-IN")}
          </p>
        )}
        {gig.description && <p className="mt-2 text-sm">{gig.description}</p>}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Applications</h2>
        {isPoster ? (
          applications.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {applications.map(({ application: a, applicant }) => (
                <li key={a.id} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{applicant.name}</p>
                  {a.message && <p className="text-sm text-muted-foreground">{a.message}</p>}
                  <p className="text-xs text-muted-foreground">Status: {a.status}</p>
                  {a.status === "pending" && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => transition({ applicationId: a.id, action: "accept" })}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating}
                        onClick={() => transition({ applicationId: a.id, action: "reject" })}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            {applications.find((a) => a.applicant.id === user?.id)
              ? "You have applied to this gig."
              : "Apply from the gigs page."}
          </p>
        )}
      </section>
    </div>
  );
}
