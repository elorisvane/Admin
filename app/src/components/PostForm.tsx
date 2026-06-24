"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Post } from "@/app/src/data/posts";
import { savePost, deletePost } from "@/app/src/actions/posts";
import { Button, Card, Field, Input, Textarea } from "@/app/src/components/ui";
import { Uploader } from "@/app/src/components/Uploader";

const empty: Post = {
  slug: "",
  title: "",
  excerpt: "",
  category: "",
  date: "",
  readTime: "",
  image: "",
  body: [""],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PostForm({ initial }: { initial?: Post }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const originalSlug = initial?.slug;

  const [form, setForm] = useState<Post>(initial ?? empty);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Post>(key: K, value: Post[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onTitle = (title: string) =>
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned: Post = {
      ...form,
      slug: form.slug || slugify(form.title),
      body: form.body.filter((b) => b.trim()),
    };
    startTransition(async () => {
      try {
        await savePost(cleaned, originalSlug);
        router.push("/blog");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  };

  const remove = () => {
    if (originalSlug && confirm("Remove this journal entry?")) {
      startTransition(async () => {
        try {
          await deletePost(originalSlug);
          router.push("/blog");
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not delete");
        }
      });
    }
  };

  const updateBody = (i: number, v: string) =>
    set("body", form.body.map((p, idx) => (idx === i ? v : p)));

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => onTitle(e.target.value)} required />
          </Field>
          <Field label="Slug" hint="Used in the storefront URL">
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              required
            />
          </Field>
          <Field label="Category">
            <Input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="CRAFTSMANSHIP"
            />
          </Field>
          <Field label="Date" hint="e.g. June 12, 2026">
            <Input value={form.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field label="Read time" hint="e.g. 6 min read">
            <Input value={form.readTime} onChange={(e) => set("readTime", e.target.value)} />
          </Field>
        </div>
        <Uploader
          label="Image"
          hint="Upload the article image (JPG, PNG or WebP)"
          value={form.image}
          onChange={(url) => set("image", url)}
        />
        <Field label="Excerpt">
          <Textarea rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
        </Field>
      </Card>

      <Card className="space-y-3 p-6">
        <p className="text-xs uppercase tracking-widest text-muted">Body</p>
        {form.body.map((para, i) => (
          <div key={i} className="flex items-start gap-3">
            <Textarea
              rows={3}
              className="flex-1"
              value={para}
              onChange={(e) => updateBody(i, e.target.value)}
            />
            <button
              type="button"
              onClick={() => set("body", form.body.filter((_, idx) => idx !== i))}
              className="mt-2 text-muted hover:text-red-500"
              aria-label="Remove paragraph"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set("body", [...form.body, ""])}
          className="text-xs uppercase tracking-widest text-gold-500 hover:text-gold-600"
        >
          + Add paragraph
        </button>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Publish entry"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/blog")}>
            Cancel
          </Button>
        </div>
        {isEdit && (
          <Button type="button" variant="danger" onClick={remove} disabled={pending}>
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
