import Link from "next/link";
import { getNavCategory } from "@/app/src/data/nav";
import NavCategoryForm from "@/app/src/components/NavCategoryForm";
import { PageHeader } from "@/app/src/components/ui";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getNavCategory(id);

  if (!item) {
    return (
      <div>
        <PageHeader
          title="Not found"
          subtitle={`No category with id “${id}”.`}
        />
        <Link href="/nav-menu" className="text-gold-500 hover:text-gold-600">
          ← Back to menu
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={item.label} subtitle="Edit this menu category." />
      <NavCategoryForm initial={item} />
    </div>
  );
}
