import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircleIcon } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { $upsertCreatorProfile, type CreatorProfileInput } from "#/lib/creators/functions.ts";
import { myCreatorProfileQueryOptions } from "#/lib/creators/queries.ts";

export const Route = createFileRoute("/_auth/app/profile/creator")({
  component: CreatorProfilePage,
});

const CREATOR_TYPES = [
  ["photographer", "Photographer"],
  ["videographer", "Videographer"],
  ["editor", "Editor"],
  ["drone_operator", "Drone operator"],
  ["product_creator", "Product creator"],
  ["wedding_creator", "Wedding creator"],
  ["event_creator", "Event creator"],
  ["content_creator", "Content creator"],
  ["other", "Other"],
] as const;

function CreatorProfilePage() {
  const queryClient = useQueryClient();
  const { data: profile, isPending } = useQuery(myCreatorProfileQueryOptions());

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (data: CreatorProfileInput) => await $upsertCreatorProfile({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myCreatorProfileQueryOptions().queryKey });
      toast.add({ type: "success", description: "Creator profile saved." });
    },
    onError: () => {
      toast.add({
        type: "error",
        description: "Could not save the profile. Check the fields and try again.",
      });
    },
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    const formData = new FormData(e.currentTarget);
    const creatorTypes = formData
      .getAll("creatorTypes")
      .filter((v): v is string => typeof v === "string");
    const splitList = (value: FormDataEntryValue | null) =>
      typeof value === "string"
        ? value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const str = (key: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value : "";
    };

    mutate({
      displayName: str("displayName"),
      bio: str("bio"),
      profileImageUrl: str("profileImageUrl"),
      coverImageUrl: str("coverImageUrl"),
      location: str("location"),
      specialties: splitList(formData.get("specialties")),
      creatorTypes: creatorTypes as CreatorProfileInput["creatorTypes"],
      startingPrice: str("startingPrice") !== "" ? Number(str("startingPrice")) : undefined,
      currency: str("currency") || "INR",
      experienceYears: str("experienceYears") !== "" ? Number(str("experienceYears")) : undefined,
      socialLinks: {
        ...(str("website") !== "" ? { website: str("website") } : {}),
        ...(str("instagram") !== "" ? { instagram: str("instagram") } : {}),
      },
      languages: splitList(formData.get("languages")),
      availabilityStatus: (str("availabilityStatus") ||
        "available") as CreatorProfileInput["availabilityStatus"],
    });
  };

  if (isPending) {
    return (
      <div className="flex justify-center p-8">
        <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Creator profile</h1>
        <p className="text-sm text-muted-foreground">
          This is how customers will find and evaluate your work.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-busy={isSaving}>
        <div className="grid gap-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={profile?.displayName ?? ""}
            required
            maxLength={100}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={profile?.bio ?? ""}
            rows={4}
            maxLength={2000}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={profile?.location ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="experienceYears">Experience (years)</Label>
            <Input
              id="experienceYears"
              name="experienceYears"
              type="number"
              min={0}
              max={80}
              defaultValue={profile?.experienceYears ?? ""}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="specialties">Specialties (comma separated)</Label>
          <Input
            id="specialties"
            name="specialties"
            defaultValue={profile?.specialties.join(", ") ?? ""}
            placeholder="weddings, portraits, reels"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="languages">Languages (comma separated)</Label>
          <Input
            id="languages"
            name="languages"
            defaultValue={profile?.languages.join(", ") ?? ""}
            placeholder="English, Hindi"
          />
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Creator types</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CREATOR_TYPES.map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="creatorTypes"
                  value={value}
                  defaultChecked={
                    profile?.creatorTypes.includes(
                      value as CreatorProfileInput["creatorTypes"][number],
                    ) ?? false
                  }
                  className="size-4"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="startingPrice">Starting price</Label>
            <Input
              id="startingPrice"
              name="startingPrice"
              type="number"
              min={0}
              defaultValue={profile?.startingPrice ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              maxLength={3}
              defaultValue={profile?.currency ?? "INR"}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="availabilityStatus">Availability</Label>
            <select
              id="availabilityStatus"
              name="availabilityStatus"
              defaultValue={profile?.availabilityStatus ?? "available"}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="profileImageUrl">Profile image URL</Label>
          <Input
            id="profileImageUrl"
            name="profileImageUrl"
            type="url"
            defaultValue={profile?.profileImageUrl ?? ""}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="coverImageUrl">Cover image URL</Label>
          <Input
            id="coverImageUrl"
            name="coverImageUrl"
            type="url"
            defaultValue={profile?.coverImageUrl ?? ""}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            defaultValue={profile?.socialLinks?.website ?? ""}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="instagram">Instagram URL</Label>
          <Input
            id="instagram"
            name="instagram"
            type="url"
            defaultValue={profile?.socialLinks?.instagram ?? ""}
          />
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving && <LoaderCircleIcon className="animate-spin" aria-hidden="true" />}
          {isSaving ? "Saving..." : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
