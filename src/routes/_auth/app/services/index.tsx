import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircleIcon, Trash2Icon } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { $createService, $deleteService, type ServiceInput } from "#/lib/services/functions.ts";
import { myServicesQueryOptions } from "#/lib/services/queries.ts";

export const Route = createFileRoute("/_auth/app/services/")({
  component: ServicesPage,
});

const CATEGORIES = [
  "wedding",
  "portrait",
  "fashion",
  "automotive",
  "product",
  "event",
  "travel",
  "food",
  "real_estate",
  "commercial",
  "social_media",
  "other",
] as const;

function ServicesPage() {
  const queryClient = useQueryClient();
  const { data: services, isPending } = useQuery(myServicesQueryOptions());

  const { mutate: addService, isPending: isAdding } = useMutation({
    mutationFn: async (data: ServiceInput) => await $createService({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myServicesQueryOptions().queryKey });
      toast.add({ type: "success", description: "Service added." });
    },
    onError: (error) =>
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Could not add the service.",
      }),
  });

  const { mutate: removeService } = useMutation({
    mutationFn: async (id: string) => await $deleteService({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myServicesQueryOptions().queryKey });
      toast.add({ type: "success", description: "Service removed." });
    },
    onError: () => toast.add({ type: "error", description: "Could not remove the service." }),
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

    addService(
      {
        title: str("title"),
        category: (str("category") || "other") as ServiceInput["category"],
        description: str("description") || undefined,
        price: str("price") !== "" ? Number(str("price")) : 0,
        currency: str("currency") || "INR",
        pricingUnit: (str("pricingUnit") || "project") as ServiceInput["pricingUnit"],
      },
      { onSuccess: () => form.reset() },
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Services</h1>
        <p className="text-sm text-muted-foreground">
          List what you offer and your starting rates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={isAdding}>
        <div className="grid gap-2">
          <Label htmlFor="title">Service title</Label>
          <Input
            id="title"
            name="title"
            required
            maxLength={120}
            placeholder="Wedding Photography"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={2000}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              defaultValue="other"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pricingUnit">Pricing unit</Label>
            <select
              id="pricingUnit"
              name="pricingUnit"
              defaultValue="project"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="hour">Hour</option>
              <option value="day">Day</option>
              <option value="project">Project</option>
              <option value="package">Package</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="price">Price</Label>
            <Input id="price" name="price" type="number" min={0} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" maxLength={3} defaultValue="INR" />
          </div>
        </div>
        <Button type="submit" disabled={isAdding}>
          {isAdding && <LoaderCircleIcon className="animate-spin" aria-hidden="true" />}
          {isAdding ? "Adding..." : "Add service"}
        </Button>
      </form>

      {isPending ? (
        <div className="flex justify-center p-6">
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        </div>
      ) : services && services.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {services.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s.category.replaceAll("_", " ")} · {s.currency} {s.price} / {s.pricingUnit}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeService(s.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${s.title}`}
              >
                <Trash2Icon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No services yet.</p>
      )}
    </div>
  );
}
