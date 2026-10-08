import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BriefcaseIcon, CheckIcon, LoaderCircleIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authQueryOptions } from "#/lib/auth/queries.ts";
import { $saveMyInterests } from "#/lib/onboarding/functions.ts";
import {
  INTERESTS,
  NO_INTERESTS,
  countInterests,
  type InterestId,
  type MarketplaceInterests,
} from "#/lib/onboarding/interests.ts";

export const Route = createFileRoute("/_auth/app/onboarding")({
  component: OnboardingPage,
});

const ICONS = {
  hireCreators: UsersIcon,
  showcaseWork: SparklesIcon,
  findGigs: BriefcaseIcon,
} as const;

/**
 * First-run intent capture. Every option is independent: picking two or three is normal, and picking
 * none is fine too. Nothing here changes what an account can do — it only shapes the home page.
 */
function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<MarketplaceInterests>(NO_INTERESTS);

  const { mutate: save, isPending } = useMutation({
    mutationFn: async (interests: MarketplaceInterests) =>
      await $saveMyInterests({ data: interests }),
    onSuccess: () => {
      // The auth query carries the new columns, so it has to be refetched for the home page to
      // see them.
      void queryClient.invalidateQueries({ queryKey: authQueryOptions().queryKey });
      void queryClient.invalidateQueries({ queryKey: ["onboarding"] });
      void navigate({ to: "/app" });
    },
    onError: (error) =>
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Could not save your choices.",
      }),
  });

  const toggle = (id: InterestId) => {
    setSelected((current) => ({ ...current, [id]: !current[id] }));
  };

  const chosen = countInterests(selected);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-6 sm:py-10">
      <header className="flex flex-col gap-3 text-center">
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          One more step
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          What brings you to Sho-vee?
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
          Pick as many as you like. Sho-vee is a single account — you can hire creators, showcase
          your own work, or do both, and change your mind whenever you want.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-3">
        {INTERESTS.map((interest) => {
          const active = selected[interest.id];
          const Icon = ICONS[interest.id];
          return (
            <li key={interest.id}>
              <button
                type="button"
                onClick={() => toggle(interest.id)}
                aria-pressed={active}
                className={`flex h-full w-full flex-col gap-3 rounded-2xl border p-5 text-left transition-all ${
                  active
                    ? "border-foreground/40 bg-secondary ring-1 ring-foreground/20"
                    : "bg-card hover:border-foreground/25"
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl border bg-background">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {active ? (
                    <span className="grid size-6 place-items-center rounded-full bg-foreground text-background">
                      <CheckIcon className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Selected</span>
                    </span>
                  ) : null}
                </span>
                <span className="text-base font-semibold tracking-tight">{interest.label}</span>
                <span className="text-sm text-muted-foreground">{interest.description}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <footer className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          className="w-full sm:w-auto"
          disabled={isPending}
          onClick={() => save(selected)}
        >
          {isPending && <LoaderCircleIcon className="animate-spin" aria-hidden="true" />}
          {isPending ? "Saving..." : chosen > 0 ? "Continue" : "Skip for now"}
        </Button>
        <p className="text-xs text-muted-foreground">
          You can change these any time, and none of them limits what you can do on Sho-vee.
        </p>
      </footer>
    </div>
  );
}
