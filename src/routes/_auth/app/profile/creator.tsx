import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LoaderCircleIcon } from "lucide-react";
import { useRef, useState } from "react";

import {
  CreatorProfilePreview,
  type ProfilePreview,
} from "#/components/creator/creator-profile-preview.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { AVAILABILITY_COPY, type Availability } from "#/lib/bookings/transitions.ts";
import { $upsertCreatorProfile, type CreatorProfileInput } from "#/lib/creators/functions.ts";
import { myCreatorProfileQueryOptions } from "#/lib/creators/queries.ts";
import { cn } from "#/lib/utils.ts";

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

const FIELD_CLASS = "h-9";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t pt-8 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** Chip-style checkbox. The input stays a real checkbox so it keeps its semantics and testability. */
function Chip({
  name,
  value,
  defaultChecked,
  children,
  type = "checkbox",
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
  children: React.ReactNode;
  type?: "checkbox" | "radio";
}) {
  return (
    <label className="cursor-pointer">
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        className={cn(
          "inline-flex h-8 items-center rounded-full border bg-card px-3 text-sm text-muted-foreground transition-colors select-none",
          "hover:border-foreground/25 hover:text-foreground",
          "peer-checked:border-foreground/40 peer-checked:bg-secondary peer-checked:text-secondary-foreground",
          "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/30",
        )}
      >
        {children}
      </span>
    </label>
  );
}

function CreatorProfilePage() {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const { data: profile, isPending } = useQuery(myCreatorProfileQueryOptions());

  // The form stays uncontrolled; the preview is derived from FormData on every change.
  const [preview, setPreview] = useState<ProfilePreview | null>(null);

  const syncPreview = () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const str = (key: string) => {
      const value = fd.get(key);
      return typeof value === "string" ? value : "";
    };
    const list = (key: string) =>
      str(key)
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

    setPreview({
      displayName: str("displayName"),
      bio: str("bio"),
      location: str("location"),
      experienceYears: str("experienceYears"),
      specialties: list("specialties"),
      languages: list("languages"),
      creatorTypes: fd.getAll("creatorTypes").filter((v): v is string => typeof v === "string"),
      startingPrice: str("startingPrice"),
      currency: str("currency"),
      availability: str("availabilityStatus"),
      profileImageUrl: str("profileImageUrl"),
      coverImageUrl: str("coverImageUrl"),
    });
  };

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

  const initialPreview: ProfilePreview = {
    displayName: profile?.displayName ?? "",
    bio: profile?.bio ?? "",
    location: profile?.location ?? "",
    experienceYears: profile?.experienceYears?.toString() ?? "",
    specialties: profile?.specialties ?? [],
    languages: profile?.languages ?? [],
    creatorTypes: profile?.creatorTypes ?? [],
    startingPrice: profile?.startingPrice?.toString() ?? "",
    currency: profile?.currency ?? "INR",
    availability: profile?.availabilityStatus ?? "available",
    profileImageUrl: profile?.profileImageUrl ?? "",
    coverImageUrl: profile?.coverImageUrl ?? "",
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {profile ? "Creator profile" : "Create your creator profile"}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {profile
            ? "This is what customers see when they find you. Update it any time — nothing here locks you in."
            : "One profile, one account. Publish it now or finish later: your work stays saved as you go, and Studio opens as soon as this is saved."}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onChange={syncPreview}
          className="flex flex-col gap-8"
          aria-busy={isSaving}
        >
          <Section title="Who you are" description="The name and one-liner customers scan first.">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  className={FIELD_CLASS}
                  defaultValue={profile?.displayName ?? ""}
                  placeholder="Asha Rao"
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
                  placeholder="Wedding and portrait photographer based in Mumbai. Available for destination shoots."
                  className="rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
                <p className="text-xs text-muted-foreground">
                  Two sentences about what you shoot and where you work.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    className={FIELD_CLASS}
                    defaultValue={profile?.location ?? ""}
                    placeholder="Mumbai"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="experienceYears">Years of experience</Label>
                  <Input
                    id="experienceYears"
                    name="experienceYears"
                    type="number"
                    min={0}
                    max={80}
                    className={FIELD_CLASS}
                    defaultValue={profile?.experienceYears ?? ""}
                    placeholder="8"
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section
            title="Your craft"
            description="Pick everything you actually take on — customers filter by these."
          >
            <div className="grid gap-5">
              <fieldset className="grid gap-2">
                <legend className="mb-2 text-sm font-medium">Creator types</legend>
                <div className="flex flex-wrap gap-2">
                  {CREATOR_TYPES.map(([value, label]) => (
                    <Chip
                      key={value}
                      name="creatorTypes"
                      value={value}
                      defaultChecked={
                        profile?.creatorTypes.includes(
                          value as CreatorProfileInput["creatorTypes"][number],
                        ) ?? false
                      }
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-2">
                <Label htmlFor="specialties">Specialties</Label>
                <Input
                  id="specialties"
                  name="specialties"
                  className={FIELD_CLASS}
                  defaultValue={profile?.specialties.join(", ") ?? ""}
                  placeholder="weddings, portraits, reels"
                />
                <p className="text-xs text-muted-foreground">
                  Comma separated. Used by search, so keep them specific.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="languages">Languages</Label>
                <Input
                  id="languages"
                  name="languages"
                  className={FIELD_CLASS}
                  defaultValue={profile?.languages.join(", ") ?? ""}
                  placeholder="English, Hindi, Marathi"
                />
              </div>
            </div>
          </Section>

          <Section
            title="Price and availability"
            description="Your starting rate sets where you appear in filtered searches."
          >
            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="startingPrice">Starting price</Label>
                  <Input
                    id="startingPrice"
                    name="startingPrice"
                    type="number"
                    min={0}
                    className={FIELD_CLASS}
                    defaultValue={profile?.startingPrice ?? ""}
                    placeholder="45000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    name="currency"
                    className={FIELD_CLASS}
                    maxLength={3}
                    defaultValue={profile?.currency ?? "INR"}
                  />
                </div>
              </div>

              <fieldset className="grid gap-2">
                <legend className="mb-2 text-sm font-medium">Availability</legend>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(AVAILABILITY_COPY) as Availability[]).map((value) => (
                    <Chip
                      key={value}
                      type="radio"
                      name="availabilityStatus"
                      value={value}
                      defaultChecked={(profile?.availabilityStatus ?? "available") === value}
                    >
                      {AVAILABILITY_COPY[value].label}
                      <span className="ms-1.5 text-xs opacity-70">
                        {AVAILABILITY_COPY[value].hint}
                      </span>
                    </Chip>
                  ))}
                </div>
              </fieldset>
            </div>
          </Section>

          <Section
            title="Images"
            description="A face and a cover image do more for trust than any description."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="profileImageUrl">Profile image URL</Label>
                <Input
                  id="profileImageUrl"
                  name="profileImageUrl"
                  type="url"
                  className={FIELD_CLASS}
                  defaultValue={profile?.profileImageUrl ?? ""}
                  placeholder="https://…"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="coverImageUrl">Cover image URL</Label>
                <Input
                  id="coverImageUrl"
                  name="coverImageUrl"
                  type="url"
                  className={FIELD_CLASS}
                  defaultValue={profile?.coverImageUrl ?? ""}
                  placeholder="https://…"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a link for now — uploading straight from your camera roll is next.
            </p>
          </Section>

          <Section title="Links" description="Where customers can see more of your work.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  className={FIELD_CLASS}
                  defaultValue={profile?.socialLinks?.website ?? ""}
                  placeholder="https://…"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input
                  id="instagram"
                  name="instagram"
                  type="url"
                  className={FIELD_CLASS}
                  defaultValue={profile?.socialLinks?.instagram ?? ""}
                  placeholder="https://instagram.com/…"
                />
              </div>
            </div>
          </Section>

          <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border bg-card/90 p-3 backdrop-blur">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <LoaderCircleIcon className="animate-spin" aria-hidden="true" />}
              {isSaving ? "Saving..." : profile ? "Save changes" : "Publish creator profile"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {profile
                ? "Changes apply to your public profile straight away."
                : "Studio opens as soon as this is saved."}
            </p>
          </div>
        </form>

        <CreatorProfilePreview
          preview={preview ?? initialPreview}
          verificationStatus={profile?.verificationStatus}
          isNew={!profile}
        />
      </div>

      {profile ? (
        <p className="text-xs text-muted-foreground">
          Looking for the work itself?{" "}
          <Link to="/app/portfolio" className="underline underline-offset-4">
            Manage your portfolio
          </Link>{" "}
          and{" "}
          <Link to="/app/posts" className="underline underline-offset-4">
            publish posts
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
