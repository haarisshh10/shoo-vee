import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { compressImage } from "#/lib/uploads/compress.ts";
import { MAX_UPLOAD_BYTES } from "#/lib/uploads/sniff.ts";

export interface UploadedMedia {
  id: string;
  url: string;
  mimeType: string;
  kind: "image" | "video";
  byteSize: number;
  width: number | null;
  height: number | null;
}

export interface UploadState {
  phase: "compressing" | "uploading" | null;
  /** 0–1 while the request is in flight; `null` before it starts. */
  progress: number | null;
  error: string | null;
}

const IDLE: UploadState = { phase: null, progress: null, error: null };

/**
 * Uploads one image: compress it, send it, hand back the stored URL.
 *
 * Compression runs before anything is sent rather than as a post-upload optimisation, because the
 * EXIF block it strips is the point — a phone photo should not publish the coordinates it was taken
 * at. Failures are reported as they happen, so a rejected file says why instead of failing later at
 * save time with no explanation.
 */
export function useImageUpload(onUploaded?: (media: UploadedMedia) => void) {
  const [state, setState] = useState<UploadState>(IDLE);
  const inputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => upload(file, onProgress),
    onMutate: () => setState({ phase: "compressing", progress: null, error: null }),
    onSuccess: (media) => {
      setState(IDLE);
      onUploaded?.(media);
    },
    onError: (error) =>
      setState({
        ...IDLE,
        error: error instanceof Error ? error.message : "That upload did not work.",
      }),
  });

  function onProgress(progress: number) {
    setState({ phase: "uploading", progress, error: null });
  }

  function start(file: File) {
    if (file.size > MAX_UPLOAD_BYTES) {
      setState({
        ...IDLE,
        error: `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
      });
      return;
    }
    mutation.mutate(file);
  }

  return {
    inputRef,
    state,
    isBusy: mutation.isPending,
    pick: () => inputRef.current?.click(),
    start,
    reset: () => {
      setState(IDLE);
      if (inputRef.current) inputRef.current.value = "";
    },
  };
}

/**
 * Posts the file as multipart with `XMLHttpRequest` rather than `fetch`: progress is the one thing
 * fetch still cannot report, and an upload with no progress bar reads as a frozen page.
 */
async function upload(file: File, onProgress: (ratio: number) => void): Promise<UploadedMedia> {
  const { file: payload, width, height } = await compressImage(file);

  const body = new FormData();
  body.append("file", payload);

  const media = await new Promise<UploadedMedia>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/uploads");

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(JSON.parse(request.responseText) as UploadedMedia);
        return;
      }
      reject(new Error(errorMessage(request)));
    });
    request.addEventListener("error", () =>
      reject(new Error("The upload did not reach the server.")),
    );
    request.addEventListener("abort", () => reject(new Error("The upload was cancelled.")));

    request.send(body);
  });

  // The client just measured this image, so it knows the size better than the server's header parse.
  return { ...media, width: width || media.width, height: height || media.height };
}

function errorMessage(request: XMLHttpRequest): string {
  try {
    const parsed = JSON.parse(request.responseText) as { message?: string };
    if (parsed.message) return parsed.message;
  } catch {
    // A proxy or a crashed handler can answer with anything; fall through to the generic message.
  }
  return "That upload did not work. Try a different image.";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
