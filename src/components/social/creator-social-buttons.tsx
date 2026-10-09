import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BookmarkIcon, UserCheckIcon, UserPlusIcon } from "lucide-react";

import { Button, buttonVariants } from "#/components/ui/button.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { useAuth } from "#/lib/auth/hooks.ts";
import { $toggleFollow, $toggleSavedCreator } from "#/lib/social/functions.ts";
import { creatorSocialCountsQueryOptions, mySocialIdsQueryOptions } from "#/lib/social/queries.ts";

type SocialIds = { savedIds: string[]; followingIds: string[] };
type SocialKind = "save" | "follow";

/** Shared toggle logic: optimistic id list, rollback on failure, and a refresh of counts/shortlist. */
function useSocialToggle(creatorId: string, kind: "save" | "follow") {
  const { user, isPending: authPending } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = mySocialIdsQueryOptions().queryKey;
  const { data } = useQuery({ ...mySocialIdsQueryOptions(), enabled: !!user });

  const active =
    (kind === "save" ? data?.savedIds : data?.followingIds)?.includes(creatorId) ?? false;

  const mutation = useMutation({
    mutationFn: async () => {
      if (kind === "save") {
        await $toggleSavedCreator({ data: { creatorId } });
      } else {
        await $toggleFollow({ data: { creatorId } });
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SocialIds>(queryKey);
      queryClient.setQueryData<SocialIds>(queryKey, (prev) => {
        if (!prev) return prev;
        const key = kind === "save" ? "savedIds" : "followingIds";
        const current = prev[key];
        return {
          ...prev,
          [key]: active ? current.filter((id) => id !== creatorId) : [...current, creatorId],
        };
      });
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Something went wrong. Try again.",
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["social"] }),
  });

  return { user, authPending, active, mutation };
}

/** Save and Follow share every behaviour except the icon, copy and request they fire. */
function SocialButton({
  creatorId,
  kind,
  compact = false,
  count,
}: {
  creatorId: string;
  kind: SocialKind;
  compact?: boolean;
  count?: number;
}) {
  const { user, authPending, active, mutation } = useSocialToggle(creatorId, kind);
  const isSave = kind === "save";
  const label = isSave ? (active ? "Saved" : "Save") : active ? "Following" : "Follow";
  const Icon = isSave ? BookmarkIcon : active ? UserCheckIcon : UserPlusIcon;

  const compactClass = active
    ? "bg-white text-black hover:bg-white/90"
    : "bg-black/50 text-white hover:bg-black/70";

  if (authPending) {
    return compact ? (
      <span className="size-8" />
    ) : (
      <span className={buttonVariants({ variant: "outline" })}>{label}</span>
    );
  }

  if (!user) {
    return (
      <Link
        to="/login"
        aria-label={`Sign in to ${isSave ? "save" : "follow"} this creator`}
        className={
          compact
            ? buttonVariants({
                size: "icon",
                className: `rounded-full border-white/20 backdrop-blur-sm ${compactClass}`,
              })
            : buttonVariants({ variant: "outline" })
        }
      >
        {compact ? (
          <Icon className="size-4" aria-hidden="true" />
        ) : (
          `Sign in to ${isSave ? "save" : "follow"}`
        )}
      </Link>
    );
  }

  const icon = (
    <Icon className={isSave && active ? "size-4 fill-current" : "size-4"} aria-hidden="true" />
  );

  if (compact) {
    return (
      <Button
        type="button"
        size="icon"
        aria-label={label}
        aria-pressed={active}
        title={label}
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        className={`rounded-full border-white/20 backdrop-blur-sm ${compactClass}`}
      >
        {icon}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      size="sm"
      aria-label={label}
      aria-pressed={active}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {icon}
      {label}
      {count !== undefined ? (
        <span className="text-muted-foreground" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </Button>
  );
}

/** Overlay action for creator cards. */
export function SaveCreatorButton({
  creatorId,
  compact = true,
}: {
  creatorId: string;
  compact?: boolean;
}) {
  return <SocialButton creatorId={creatorId} kind="save" compact={compact} />;
}

/** Follow and Save for a creator profile, with the public follower/save counts. */
export function CreatorSocialActions({ creatorId }: { creatorId: string }) {
  const { data } = useQuery(creatorSocialCountsQueryOptions(creatorId));

  return (
    <div className="flex items-center gap-2">
      <SocialButton creatorId={creatorId} kind="follow" count={data?.followers} />
      <SocialButton creatorId={creatorId} kind="save" count={data?.saves} />
    </div>
  );
}
