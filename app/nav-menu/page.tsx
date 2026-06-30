import Link from "next/link";
import { getNavCategories } from "@/app/src/data/nav";
import { Button, PageHeader } from "@/app/src/components/ui";
import NavCategoriesTable from "@/app/src/components/NavCategoriesTable";

export const dynamic = "force-dynamic";

export default async function NavMenuPage() {
  const items = await getNavCategories();

  return (
    <div>
      <PageHeader
        title="Menu & categories"
        subtitle={`${items.length} categories in the storefront navigation`}
        action={
          <Link href="/nav-menu/new">
            <Button>+ New category</Button>
          </Link>
        }
      />
      <NavCategoriesTable items={items} />
    </div>
  );
}
