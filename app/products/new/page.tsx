import ProductForm from "@/app/src/components/ProductForm";
import { PageHeader } from "@/app/src/components/ui";
import { getNavCategories } from "@/app/src/data/nav";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getNavCategories();
  return (
    <div>
      <PageHeader title="New creation" subtitle="Add a piece to the storefront collection." />
      <ProductForm categories={categories} />
    </div>
  );
}
