import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircleIcon, Trash2Icon } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { $addEquipment, $removeEquipment, type EquipmentInput } from "#/lib/equipment/functions.ts";
import { myEquipmentQueryOptions } from "#/lib/equipment/queries.ts";

export const Route = createFileRoute("/_auth/app/equipment/")({
  component: EquipmentPage,
});

const CATEGORIES = [
  "camera",
  "lens",
  "lighting",
  "audio",
  "drone",
  "gimbal",
  "tripod",
  "accessory",
  "other",
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Equipment</h1>
        <p className="text-sm text-muted-foreground">Show customers the gear you work with.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={isAdding}>
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required maxLength={120} placeholder="FX3" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" name="brand" placeholder="Sony" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" name="model" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue="camera"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={isAdding}>
          {isAdding && <LoaderCircleIcon className="animate-spin" aria-hidden="true" />}
          {isAdding ? "Adding..." : "Add equipment"}
        </Button>
      </form>

      {isPending ? (
        <div className="flex justify-center p-6">
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        </div>
      ) : items && items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map(({ equipment: e }) => (
            <li key={e.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">
                  {e.brand ? `${e.brand} ` : ""}
                  {e.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.category}
                  {e.model ? ` · ${e.model}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeEquipment(e.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${e.name}`}
              >
                <Trash2Icon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No equipment added yet.</p>
      )}
    </div>
  );
}
