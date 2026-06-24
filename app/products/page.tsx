import Link from "next/link";
import { getProducts } from "@/app/src/data/products";
import { Button, PageHeader } from "@/app/src/components/ui";
import ProductsTable from "@/app/src/components/ProductsTable";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const all = await getProducts();
  const products = category
    ? all.filter((p) => p.category === category)
    : all;

  const subtitle = category
    ? `${products.length} ${
        products.length === 1 ? "piece" : "pieces"
      } in ${category}`
    : `${all.length} pieces in the collection`;

  return (
    <div>
      <PageHeader
        title="Creations"
        subtitle={subtitle}
        action={
          <Link href="/products/new">
            <Button>+ New piece</Button>
          </Link>
        }
      />
      <ProductsTable products={products} />
    </div>
  );
}
