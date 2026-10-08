import { ChevronDownIcon, ImageOffIcon, LoaderCircleIcon, UploadIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { MEDIA_URL_PATTERN } from "#/lib/uploads/schema.ts";
import { useImageUpload } from "#/lib/uploads/use-image-upload.ts";
import { cn } from "#/lib/utils.ts";

/**
 * Form controls for the Studio composers.
 *
 * These stay native elements on purpose: the composer's submit handler reads `FormData`, and a real
 * `<select>` or checkbox keeps keyboard behaviour, form serialisation and the existing tests intact.
 * Only the presentation is restyled, so nothing looks like an unstyled browser default.
 */

export function StudioSelect({
  id,
  name,
  label,
  options,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  options: readonly (readonly [string, string])[];
  defaultValue: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={defaultValue}
          className="h-9 w-full appearance-none rounded-xl border border-input bg-transparent py-1 pr-8 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          {options.map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/**
 * Chip group for a checkbox or radio set. The input is a real checkbox or radio under a styled
 * label, so it keeps its role, its name and its `FormData` entry.
 */
export function StudioChips<T extends string>({
  legend,
  name,
  options,
  defaultValue,
  type = "checkbox",
  hint,
}: {
  legend: string;
  name: string;
  options: readonly (readonly [T, string])[];
  /** Radio groups need one value preselected; checkbox groups default to nothing. */
  defaultValue?: T;
  type?: "checkbox" | "radio";
  hint?: string;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([value, label]) => (
          <label key={value} className="cursor-pointer">
            <input
              type={type}
              name={name}
              value={value}
              defaultChecked={type === "radio" ? defaultValue === value : false}
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
              {label}
            </span>
          </label>
        ))}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </fieldset>
  );
}

/**
 * Media URL field with an inline preview.
 *
 * The preview is what makes a pasted URL trustworthy — a broken link is otherwise invisible until
 * someone opens the public profile. This is also the seam where a real upload dropzone replaces the
 * URL box without changing the composer around it.
 */
export function MediaField({
  id,
  name,
  label,
  mediaType,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  mediaType: "image" | "video";
  hint?: string;
}) {
  const [url, setUrl] = useState("");
  const { inputRef, state, isBusy, pick, start } = useImageUpload((media) => setUrl(media.url));
  const isVideo = mediaType === "video";

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={id}
          name={name}
          type="text"
          inputMode="url"
          // Validated here as well as on the server, and against the same rule: `type="url"` would
          // refuse the path an upload produces, and would refuse it by blocking the submit silently.
          pattern={MEDIA_URL_PATTERN}
          title="An uploaded image, or a link to one"
          required
          placeholder="https://…"
          className="h-9 max-w-xs"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        {isVideo ? null : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) start(file);
              }}
            />
            <Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={pick}>
              {isBusy ? (
                <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <UploadIcon className="size-4" aria-hidden="true" />
              )}
              {state.phase === "compressing"
                ? "Preparing…"
                : state.phase === "uploading"
                  ? `Uploading ${Math.round((state.progress ?? 0) * 100)}%`
                  : "Upload"}
            </Button>
          </>
        )}
      </div>
      <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/40">
        {url.trim() ? (
          <MediaPreview url={url.trim()} mediaType={mediaType} />
        ) : (
          <p className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <ImageOffIcon className="size-5" aria-hidden="true" />
            {isVideo ? "Paste a link to your video" : "Upload a photo or paste a link"}
          </p>
        )}
      </div>
      {state.error ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function MediaPreview({ url, mediaType }: { url: string; mediaType: "image" | "video" }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <p className="flex flex-col items-center gap-2 px-4 text-center text-xs text-destructive">
        <ImageOffIcon className="size-5" aria-hidden="true" />
        That link could not be loaded. Check the URL is reachable.
      </p>
    );
  }

  return mediaType === "video" ? (
    <video
      src={url}
      className="size-full object-cover"
      muted
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
    >
      <track kind="captions" label="No captions available" />
    </video>
  ) : (
    <img src={url} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
  );
}
