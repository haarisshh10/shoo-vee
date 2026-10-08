import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2Icon } from "lucide-react";

import { StudioChips } from "#/components/studio/studio-fields.tsx";
import {
  StudioEmpty,
  StudioPage,
  StudioPanel,
  StudioSubmit,
} from "#/components/studio/studio-page.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { $addEquipment, $removeEquipment, type EquipmentInput } from "#/lib/equipment/functions.ts";
import { myEquipmentQueryOptions } from "#/lib/equipment/queries.ts";

export const Route = createFileRoute("/_auth/app/equipment/")({
  component: EquipmentPage,
});

const CATEGORIES = [
  ["camera", "Camera"],
  ["lens", "Lens"],
  ["lighting", "Lighting"],
  ["audio", "Audio"],
  ["drone", "Drone"],
  ["gimbal", "Gimbal"],
  ["tripod", "Tripod"],
  ["accessory", "Accessory"],
  ["other", "Other"],
] as const;

function EquipmentPage() {
  const queryClient = useQueryClient();
  const { data: items, isPending } = useQuery(myEquipmentQueryOptions());

  const { mutate: addEquipment, isPending: isAdding } = useMutation({
    mutationFn: async (data: EquipmentInput) => await $addEquipment({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myEquipmentQueryOptions().queryKey });
      toast.add({ type: "success", description: "Equipment added." });
    },
    onError: (error) =>
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Could not add equipment.",
      }),
  });

  const { mutate: removeEquipment } = useMutation({
    mutationFn: async (equipmentId: string) => await $removeEquipment({ data: { equipmentId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myEquipmentQueryOptions().queryKey });
      toast.add({ type: "success", description: "Equipment removed." });
    },
    onError: () => toast.add({ type: "error", description: "Could not remove equipment." }),
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isAdding) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const str = (key: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value : "";
    };

    addEquipment(
      {
        name: str("name"),
        brand: str("brand") || undefined,
        model: str("model") || undefined,
        category: (str("category") || "other") as EquipmentInput["category"],
      },
      { onSuccess: () => form.reset() },
    );
  };

  const total = items?.length ?? 0;
  // Customers filter Discover by gear, so grouping by category shows the same shape they search.
  const byCategory = new Map<string, NonNullable<typeof items>>();
  for (const item of items ?? []) {
    const group = byCategory.get(item.equipment.category);
    if (group) group.push(item);
    else byCategory.set(item.equipment.category, [item]);
  }

  return (
    <StudioPage
      title="Equipment"
      description="The gear you work with. Customers filter Discover by it, so accuracy matters more than a long list."
      count={total}
      isPending={isPending}
    >
      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-8">
        <form
          onSubmit={handleSubmit}
          className="lg:sticky lg:top-24 lg:self-start"
          aria-busy={isAdding}
        >
          <StudioPanel
            title="Add gear"
            description="Matched against a shared catalogue, so the same camera is never listed twice."
            className="flex flex-col gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={120}
                className="h-9"
                placeholder="FX3"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" name="brand" className="h-9" placeholder="Sony" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" className="h-9" placeholder="ILME-FX3" />
              </div>
            </div>

            <StudioChips
              legend="Category"
              name="category"
              options={CATEGORIES}
              type="radio"
              defaultValue="camera"
            />

            <StudioSubmit isPending={isAdding} pendingLabel="Adding...">
              Add equipment
            </StudioSubmit>
          </StudioPanel>
        </form>

        {total > 0 ? (
          <div className="flex flex-col gap-6">
            {[...byCategory].map(([category, group]) => (
              <section key={category} className="flex flex-col gap-3">
                <h2 className="text-sm font-medium text-muted-foreground capitalize">{category}</h2>
                <ul className="grid items-start gap-3 sm:grid-cols-2">
                  {group?.map(({ equipment }) => (
                    <li
                      key={equipment.id}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {equipment.brand ? `${equipment.brand} ` : ""}
                          {equipment.name}
                        </p>
                        {equipment.model ? (
                          <Badge variant="secondary" className="mt-1 rounded-full font-normal">
                            {equipment.model}
                          </Badge>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEquipment(equipment.id)}
                        className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                        aria-label={`Remove ${equipment.name}`}
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <StudioEmpty
            title="No equipment listed yet"
            hint="The kit you shoot on is a real differentiator for technical buyers."
          >
            Add the body, lens and lighting you work with. Customers searching for a specific setup
            in Discover will find you by it.
          </StudioEmpty>
        )}
      </div>
    </StudioPage>
  );
}
