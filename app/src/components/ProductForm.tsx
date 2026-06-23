"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Product } from "@/app/src/data/products";
import { saveProduct, deleteProduct } from "@/app/src/actions/products";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
} from "@/app/src/components/ui";
import { Uploader } from "@/app/src/components/Uploader";

const CATEGORIES = [
  "NECKLACE",
  "BRACELET",
  "EARRING",
  "BROOCH",
  "WATCH",
  "RING",
] as const;

const MATERIAL_PRESETS = [
  "18kt White Gold",
  "18kt Yellow Gold",
  "18kt Rose Gold",
  "14kt White Gold",
  "14kt Yellow Gold",
  "14kt Rose Gold",
  "Platinum",
  "Sterling Silver",
] as const;

const empty: Product = {
  slug: "",
  name: "",
  category: "",
  price: "",
  tagline: "",
  image: "",
  description: [""],
  details: [{ label: "", value: "" }],
  materials: [""],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const originalSlug = initial?.slug;

  const [form, setForm] = useState<Product>(initial ?? empty);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onName = (name: string) =>
    setForm((f) => ({
      ...f,
      name,
      slug: slugTouched ? f.slug : slugify(name),
    }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned: Product = {
      ...form,
      slug: form.slug || slugify(form.name),
      description: form.description.filter((d) => d.trim()),
      materials: form.materials.filter((m) => m.trim()),
      details: form.details.filter((d) => d.label.trim() || d.value.trim()),
    };
    startTransition(async () => {
      try {
        await saveProduct(cleaned, originalSlug);
        router.push("/products");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  };

  const remove = () => {
    if (originalSlug && confirm("Remove this creation from the storefront?")) {
      startTransition(async () => {
        try {
          await deleteProduct(originalSlug);
          router.push("/products");
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
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => onName(e.target.value)}
              required
            />
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
            <Select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {form.category &&
                !CATEGORIES.includes(
                  form.category as (typeof CATEGORIES)[number],
                ) && <option value={form.category}>{form.category}</option>}
            </Select>
          </Field>
          <Field label="Price" hint="Pre-formatted, e.g. $48,500">
            <Input
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Tagline">
          <Input
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
          />
        </Field>
        <Uploader
          label="Image"
          hint="Upload the product photo (JPG, PNG or WebP)"
          value={form.image}
          onChange={(url) => set("image", url)}
        />
      </Card>

      <ListEditor
        title="Description"
        items={form.description}
        onChange={(v) => set("description", v)}
        render={(value, onChange) => (
          <Textarea
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        blank=""
        addLabel="+ Add paragraph"
      />

      <ListEditor
        title="Details"
        items={form.details}
        onChange={(v) => set("details", v)}
        render={(value, onChange) => (
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Label"
              value={value.label}
              onChange={(e) => onChange({ ...value, label: e.target.value })}
            />
            <Input
              placeholder="Value"
              value={value.value}
              onChange={(e) => onChange({ ...value, value: e.target.value })}
            />
          </div>
        )}
        blank={{ label: "", value: "" }}
        addLabel="+ Add detail"
      />

      <ListEditor
        title="Materials"
        items={form.materials}
        onChange={(v) => set("materials", v)}
        render={(value, onChange) => (
          <Input value={value} onChange={(e) => onChange(e.target.value)} />
        )}
        blank=""
        addLabel="+ Add material"
        footer={
          <div className="flex flex-wrap gap-2">
            {MATERIAL_PRESETS.map((material) => {
              const added = form.materials.some(
                (m) => m.trim().toLowerCase() === material.toLowerCase(),
              );
              return (
                <button
                  key={material}
                  type="button"
                  disabled={added}
                  onClick={() =>
                    set("materials", [...form.materials, material])
                  }
                  className="rounded-full border border-border px-3 py-1 text-xs text-foreground transition-colors hover:border-gold-400 hover:text-gold-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  + {material}
                </button>
              );
            })}
          </div>
        }
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create piece"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/products")}
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

function ListEditor<T>({
  title,
  items,
  onChange,
  render,
  blank,
  addLabel,
  footer,
}: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  render: (value: T, onChange: (v: T) => void) => React.ReactNode;
  blank: T;
  addLabel: string;
  footer?: React.ReactNode;
}) {
  const update = (i: number, v: T) =>
    onChange(items.map((item, idx) => (idx === i ? v : item)));
  const removeAt = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <Card className="space-y-3 p-6">
      <p className="text-xs uppercase tracking-widest text-muted">{title}</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex-1">{render(item, (v) => update(i, v))}</div>
          <button
            type="button"
            onClick={() => removeAt(i)}
            className="mt-2 text-muted hover:text-red-500"
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, blank])}
        className="text-xs uppercase tracking-widest text-gold-500 hover:text-gold-600"
      >
        {addLabel}
      </button>
      {footer}
    </Card>
  );
}
