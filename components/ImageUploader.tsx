"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGES, MAX_IMAGE_BYTES } from "@/lib/categories";

type Item = { id: string; file: File; url: string };

const MAX_DIMENSION = 1600;

/** Downscales large photos in the browser so uploads stay small and fast on mobile data. */
async function compress(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024 && file.type === "image/jpeg") return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // flatten transparency (PNG/WebP) onto white
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file.size <= MAX_IMAGE_BYTES ? file : blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function ImageUploader({
  onChange,
  error,
}: {
  onChange: (files: File[]) => void;
  error?: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [localError, setLocalError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const created = urls.current;
    return () => created.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function commit(next: Item[]) {
    setItems(next);
    onChange(next.map((i) => i.file));
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    if (picked.length === 0) return;
    setLocalError("");

    const room = MAX_IMAGES - items.length;
    if (picked.length > room) setLocalError(`You can upload a maximum of ${MAX_IMAGES} images.`);

    setBusy(true);
    const added: Item[] = [];
    for (const file of picked.slice(0, Math.max(room, 0))) {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        setLocalError("Only JPG, PNG or WebP images are allowed.");
        continue;
      }
      const processed = await compress(file);
      if (processed.size > MAX_IMAGE_BYTES) {
        setLocalError("Each image must be 5 MB or smaller.");
        continue;
      }
      const url = URL.createObjectURL(processed);
      urls.current.push(url);
      added.push({ id: crypto.randomUUID(), file: processed, url });
    }
    setBusy(false);
    commit([...items, ...added]);
  }

  function remove(id: string) {
    setLocalError("");
    commit(items.filter((i) => i.id !== id));
  }

  function makeMain(id: string) {
    const picked = items.find((i) => i.id === id);
    if (picked) commit([picked, ...items.filter((i) => i.id !== id)]);
  }

  const message = localError || error;

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {items.map((item, i) => (
          <li key={item.id} className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-sand-dark bg-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={`Selected photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 ? (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-cream">
                Main
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeMain(item.id)}
                aria-label={`Make photo ${i + 1} the main image`}
                className="absolute left-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cream/95"
              >
                <Star className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cream/95"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
        {items.length < MAX_IMAGES && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy}
              className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-sand-dark bg-white text-center text-xs font-medium text-muted hover:border-rose hover:text-rose disabled:opacity-60"
            >
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
              {busy ? "Preparing…" : items.length === 0 ? "Add main photo" : "Add photo"}
            </button>
          </li>
        )}
      </ul>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose photos"
      />
      <p className="text-xs text-muted">
        Up to {MAX_IMAGES} photos (JPG, PNG or WebP). The first photo is the main image. Photos are resized
        automatically.
      </p>
      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}
