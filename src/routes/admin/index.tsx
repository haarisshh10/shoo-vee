import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LoaderCircleIcon } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";
import { toast } from "#/components/ui/toast.tsx";
import {
  $adminCloseGig,
  $adminRemovePost,
  $adminSetCreatorVerification,
  $adminSetUserRole,
} from "#/lib/admin/functions.ts";
import { requireAdminRoute } from "#/lib/admin/guard.ts";
import {
  adminCreatorsQueryOptions,
  adminGigsQueryOptions,
  adminPostsQueryOptions,
} from "#/lib/admin/queries.ts";

export const Route = createFileRoute("/admin/")({
  beforeLoad: requireAdminRoute,
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const creators = useQuery(adminCreatorsQueryOptions());

  const { mutate: setVerification } = useMutation({
    mutationFn: async (data: {
      creatorId: string;
      status: "verified" | "unverified" | "rejected" | "pending";
    }) => await $adminSetCreatorVerification({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.add({ type: "success", description: "Updated." });
    },
    onError: (error) =>
      toast.add({ type: "error", description: error instanceof Error ? error.message : "Failed." }),
  });

  const { mutate: setRole } = useMutation({
    mutationFn: async (data: { userId: string; role: "user" | "admin" }) =>
      await $adminSetUserRole({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.add({ type: "success", description: "Role updated." });
    },
    onError: (error) =>
      toast.add({ type: "error", description: error instanceof Error ? error.message : "Failed." }),
  });

  const { mutate: removePost } = useMutation({
    mutationFn: async (postId: string) => await $adminRemovePost({ data: { postId } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.add({
        type: "success",
        description: result.resolvedReports
          ? `Post removed. ${result.resolvedReports} report(s) closed.`
          : "Post removed.",
      });
    },
    onError: () => toast.add({ type: "error", description: "Failed." }),
  });

  const { mutate: closeGig } = useMutation({
    mutationFn: async (gigId: string) => await $adminCloseGig({ data: { gigId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.add({ type: "success", description: "Gig closed." });
    },
    onError: () => toast.add({ type: "error", description: "Failed." }),
  });

  const posts = useQuery(adminPostsQueryOptions());
  const gigs = useQuery(adminGigsQueryOptions());

  if (creators.isError) {
    return (
      <p className="p-10 text-sm text-muted-foreground">Not authorized. Admin access required.</p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <Link to="/admin/reports" className="text-sm underline">
          Reports
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Creators</h2>
        {creators.isPending ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        ) : (
          <ul className="flex flex-col gap-2">
            {creators.data?.map(({ profile, owner }) => (
              <li
                key={profile.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{profile.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {owner.email} · {profile.verificationStatus} · {owner.role}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.verificationStatus !== "verified" ? (
                    <Button
                      size="sm"
                      onClick={() => setVerification({ creatorId: profile.id, status: "verified" })}
                    >
                      Verify
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setVerification({ creatorId: profile.id, status: "unverified" })
                      }
                    >
                      Unverify
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setVerification({ creatorId: profile.id, status: "rejected" })}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setRole({
                        userId: owner.id,
                        role: owner.role === "admin" ? "user" : "admin",
                      })
                    }
                  >
                    {owner.role === "admin" ? "Remove admin" : "Make admin"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Posts</h2>
        <ul className="flex flex-col gap-2">
          {posts.data?.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-md border p-3">
              <p className="line-clamp-1 text-sm">{p.caption ?? p.mediaUrl}</p>
              <Button size="sm" variant="outline" onClick={() => removePost(p.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Gigs</h2>
        <ul className="flex flex-col gap-2">
          {gigs.data?.map((g) => (
            <li key={g.id} className="flex items-center justify-between rounded-md border p-3">
              <p className="text-sm">
                {g.title} · {g.status}
              </p>
              {g.status === "open" && (
                <Button size="sm" variant="outline" onClick={() => closeGig(g.id)}>
                  Close
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
