import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { IndianRupeeIcon, Trash2Icon } from "lucide-react";

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
import { $createService, $deleteService, type ServiceInput } from "#/lib/services/functions.ts";
import { myServicesQueryOptions } from "#/lib/services/queries.ts";

export const Route = createFileRoute("/_auth/app/services/")({
  component: ServicesPage,
});

const CATEGORIES = [
  ["wedding", "Wedding"],
  ["portrait", "Portrait"],
  ["fashion", "Fashion"],
  ["automotive", "Automotive"],
  ["product", "Product"],
  ["event", "Event"],
  ["travel", "Travel"],
  ["food", "Food"],
  ["real_estate", "Real estate"],
  ["commercial", "Commercial"],
  ["social_media", "Social media"],
  ["other", "Other"],
] as const;

const PRICING_UNITS = [
  ["hour", "Hour"],
  ["day", "Day"],
  ["project", "Project"],
  ["package", "Package"],
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

  const total = services?.length ?? 0;

  return (
    <StudioPage
      title="Services"
      description="What you offer and what it costs. Customers book a specific service, not your profile in general."
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
            title="Add a service"
            description="Price it the way you would quote it on a call."
            className="flex flex-col gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="title">Service title</Label>
              <Input
                id="title"
                name="title"
                required
                maxLength={120}
                className="h-9"
                placeholder="Wedding coverage"
              />
            </div>

            <div className="grid gap-4">
              <StudioChips
                legend="Category"
                name="category"
                options={CATEGORIES}
                type="radio"
                defaultValue="other"
              />
              <StudioChips
                legend="Priced per"
                name="pricingUnit"
                options={PRICING_UNITS}
                type="radio"
                defaultValue="project"
              />
            </div>

            <div className="grid grid-cols-[1fr_5rem] gap-3">
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  required
                  className="h-9"
                  placeholder="45000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  name="currency"
                  maxLength={3}
                  defaultValue="INR"
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={2000}
                placeholder="What is included, how long it takes, and what you need from the client."
                className="rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
            </div>

            <StudioSubmit isPending={isAdding} pendingLabel="Adding...">
              Add service
            </StudioSubmit>
          </StudioPanel>
        </form>

        {total > 0 ? (
          <ul className="grid items-start gap-4 sm:grid-cols-2">
            {services?.map((service) => (
              <li key={service.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold tracking-tight">{service.title}</h3>
                  <button
                    type="button"
                    onClick={() => removeService(service.id)}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Delete ${service.title}`}
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>

                {service.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {service.description}
                  </p>
                ) : null}

                <div className="mt-auto flex items-end justify-between gap-3 border-t pt-3">
                  <p className="flex items-center gap-1 text-lg font-semibold tracking-tight">
                    <IndianRupeeIcon className="size-4" aria-hidden="true" />
                    {service.currency} {service.price.toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-muted-foreground">
                      / {service.pricingUnit}
                    </span>
                  </p>
                  <Badge variant="secondary" className="rounded-full font-normal capitalize">
                    {service.category.replaceAll("_", " ")}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <StudioEmpty
            title="No services listed yet"
            hint="Two or three clear services beat one vague 'photography' listing."
          >
            Customers cannot request a booking without knowing what you charge. List the two things
            you get booked for most, at your real rates.
          </StudioEmpty>
        )}
      </div>
    </StudioPage>
  );
}
