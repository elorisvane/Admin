"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { HomeMedia } from "@/app/src/data/home";
import { saveHomeMedia, deleteHomeMedia } from "@/app/src/actions/home";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
} from "@/app/src/components/ui";
import { Uploader } from "@/app/src/components/Uploader";

const empty: HomeMedia = {
  id: "",
  placement: "campaign",
  mediaType: "image",
  src: "",
  poster: "",
  title: "",
  subtitle: "",
  alt: "",
  linkUrl: "",
  sortOrder: 0,
};

export default function HomeMediaForm({ initial }: { initial?: HomeMedia }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const originalId = initial?.id;

  const [form, setForm] = useState<HomeMedia>(initial ?? empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof HomeMedia>(key: K, value: HomeMedia[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isCampaign = form.placement === "campaign";
  const isVideo = form.mediaType === "video";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned: HomeMedia = {
      ...form,
      src: form.src.trim(),
      poster: form.poster.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      alt: form.alt.trim(),
      linkUrl: form.linkUrl.trim(),
      sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
    };
    if (!cleaned.src) {
      setError("Please upload an image or video first.");
      return;
    }
    startTransition(async () => {
      try {
        await saveHomeMedia(cleaned, originalId);
        router.push("/home-media");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  };

  const remove = () => {
    if (originalId && confirm("Remove this item from the home page?")) {
      startTransition(async () => {
        try {
          await deleteHomeMedia(originalId);
          router.push("/home-media");
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not delete");
        }
      });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-5">
          <Field label="Placement" hint="Where it shows on the home page">
            <Select
              value={form.placement}
              onChange={(e) =>
                set("placement", e.target.value as HomeMedia["placement"])
              }
            >
              <option value="campaign">Campaign section (full screen)</option>
              <option value="gallery">Gallery strip (bottom)</option>
            </Select>
          </Field>
          <Field label="Media type">
            <Select
              value={form.mediaType}
              onChange={(e) =>
                set("mediaType", e.target.value as HomeMedia["mediaType"])
              }
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </Select>
          </Field>
        </div>

        <Uploader
          label={isVideo ? "Video" : "Image"}
          kind={isVideo ? "video" : "image"}
          hint={
            isVideo
              ? "Upload the campaign video (MP4 or WebM)"
              : "Upload the campaign image (JPG, PNG or WebP)"
          }
          value={form.src}
          onChange={(url) => set("src", url)}
        />

        {isVideo && (
          <Uploader
            label="Poster image"
            hint="Optional still shown before the video plays"
            value={form.poster}
            onChange={(url) => set("poster", url)}
          />
        )}
      </Card>

      <Card className="space-y-5 p-6">
        {isCampaign ? (
          <div className="grid grid-cols-2 gap-5">
            <Field label="Title" hint="Caption shown over the artwork">
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="HIGH JEWELLERY"
              />
            </Field>
            <Field label="Subtitle">
              <Input
                value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                placeholder="DISCOVER THE CAMPAIGN"
              />
            </Field>
          </div>
        ) : null}

        <Field
          label="Link URL"
          hint="Optional — where it opens when clicked (e.g. /products, /products/aurora-diamond-necklace, or https://…)"
        >
          <Input
            value={form.linkUrl}
            onChange={(e) => set("linkUrl", e.target.value)}
            placeholder="/products"
          />
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Alt text" hint="Describes the media for accessibility">
            <Input
              value={form.alt}
              onChange={(e) => set("alt", e.target.value)}
              placeholder="Diamond earring"
            />
          </Field>
          <Field label="Order" hint="Lower numbers appear first">
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add to home page"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/home-media")}
          >
            Cancel
          </Button>
        </div>
        {isEdit && (
          <Button
            type="button"
            variant="danger"
            onClick={remove}
            disabled={pending}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
