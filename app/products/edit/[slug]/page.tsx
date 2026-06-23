import Link from "next/link";
import { getProduct } from "@/app/src/data/products";
import ProductForm from "@/app/src/components/ProductForm";
import { PageHeader } from "@/app/src/components/ui";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return (
      <div>
        <PageHeader title="Not found" subtitle={`No creation with slug “${slug}”.`} />
        <Link href="/products" className="text-gold-500 hover:text-gold-600">
          ← Back to creations
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={product.name} subtitle="Edit this creation." />
      <ProductForm initial={product} />
    </div>
  );
}
