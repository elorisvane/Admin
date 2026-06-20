import ProductForm from "@/app/src/components/ProductForm";
import { PageHeader } from "@/app/src/components/ui";

export default function NewProductPage() {
  return (
    <div>
      <PageHeader title="New creation" subtitle="Add a piece to the storefront collection." />
      <ProductForm />
    </div>
  );
}
