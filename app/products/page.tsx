import Link from "next/link";
import { getProducts } from "@/app/src/data/products";
import { Button, PageHeader } from "@/app/src/components/ui";
import ProductsTable from "@/app/src/components/ProductsTable";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <PageHeader
        title="Creations"
        subtitle={`${products.length} pieces in the collection`}
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
