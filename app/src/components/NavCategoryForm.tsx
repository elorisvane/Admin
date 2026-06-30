"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { NavCategory, NavSubcategory } from "@/app/src/data/nav";
import { saveNavCategory, deleteNavCategory } from "@/app/src/actions/nav";
import { Button, Card, Field, Input } from "@/app/src/components/ui";
import { Uploader } from "@/app/src/components/Uploader";

const empty: NavCategory = {
  id: "",
  label: "",
  linkUrl: "/products",
  sortOrder: 0,
  subcategories: [],
};

const emptySub: NavSubcategory = { label: "", image: "", linkUrl: "/products" };

export default function NavCategoryForm({
  initial,
}: {
  initial?: NavCategory;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const originalId = initial?.id;

  const [form, setForm] = useState<NavCategory>(initial ?? empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof NavCategory>(key: K, value: NavCategory[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // --- Sub-category tile helpers ---
  const setSub = (i: number, patch: Partial<NavSubcategory>) =>
    setForm((f) => ({
      ...f,
      subcategories: f.subcategories.map((s, idx) =>
        idx === i ? { ...s, ...patch } : s
      ),
    }));

  const addSub = () =>
    setForm((f) => ({
      ...f,
      subcategories: [...f.subcategories, { ...emptySub }],
    }));

  const removeSub = (i: number) =>
    setForm((f) => ({
      ...f,
      subcategories: f.subcategories.filter((_, idx) => idx !== i),
    }));

  const moveSub = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      const next = [...f.subcategories];
      const j = i + dir;
      if (j < 0 || j >= next.length) return f;
      [next[i], next[j]] = [next[j], next[i]];
      return { ...f, subcategories: next };
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned: NavCategory = {
      ...form,
      label: form.label.trim(),
      linkUrl: form.linkUrl.trim(),
      sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
      subcategories: form.subcategories
        .map((s) => ({
          label: s.label.trim(),
          image: s.image.trim(),
          linkUrl: s.linkUrl.trim(),
        }))
        // Drop blank rows the editor left behind.
        .filter((s) => s.label || s.image),
    };
    if (!cleaned.label) {
      setError("Please enter a category name.");
      return;
    }
    startTransition(async () => {
      try {
        await saveNavCategory(cleaned, originalId);
        router.push("/nav-menu");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  };

  const remove = () => {
    if (originalId && confirm(`Remove “${form.label}” from the menu?`)) {
      startTransition(async () => {
        try {
          await deleteNavCategory(originalId);
          router.push("/nav-menu");
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Category name" hint="Shown in the storefront menu bar">
            <Input
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="HIGH JEWELLERY"
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
        <Field
          label="Link URL"
          hint="Where the menu item links when it has no sub-categories (e.g. /products)"
        >
          <Input
            value={form.linkUrl}
            onChange={(e) => set("linkUrl", e.target.value)}
            placeholder="/products"
          />
        </Field>
      </Card>

      <Card className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl text-foreground">
              Sub-categories
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tiles shown in the drop-down panel under this category.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={addSub}>
            + Add tile
          </Button>
        </div>

        {form.subcategories.length === 0 ? (
          <p className="text-sm text-muted">
            No sub-categories yet — this menu item will simply link to its URL.
          </p>
        ) : (
          <div className="space-y-4">
            {form.subcategories.map((sub, i) => (
              <div
                key={i}
                className="rounded-md border border-border p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Tile name">
                        <Input
                          value={sub.label}
                          onChange={(e) =>
                            setSub(i, { label: e.target.value })
                          }
                          placeholder="RING"
                        />
                      </Field>
                      <Field label="Link URL">
                        <Input
                          value={sub.linkUrl}
                          onChange={(e) =>
                            setSub(i, { linkUrl: e.target.value })
                          }
                          placeholder="/products"
                        />
                      </Field>
                    </div>
                    <Uploader
                      label="Tile image"
                      hint="Square image works best"
                      value={sub.image}
                      onChange={(url) => setSub(i, { image: url })}
                    />
                  </div>

                  {/* Reorder / remove controls */}
                  <div className="flex shrink-0 flex-col items-stretch gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveSub(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                      className="rounded-md border border-border px-2 py-1 text-xs text-muted transition-colors hover:border-gold-400 hover:text-gold-600 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSub(i, 1)}
                      disabled={i === form.subcategories.length - 1}
                      aria-label="Move down"
                      className="rounded-md border border-border px-2 py-1 text-xs text-muted transition-colors hover:border-gold-400 hover:text-gold-600 disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSub(i)}
                      className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add category"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/nav-menu")}
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
