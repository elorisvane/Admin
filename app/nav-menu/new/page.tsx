import NavCategoryForm from "@/app/src/components/NavCategoryForm";
import { PageHeader } from "@/app/src/components/ui";

export default function NewNavCategoryPage() {
  return (
    <div>
      <PageHeader
        title="New category"
        subtitle="Add a category to the storefront menu, with optional drop-down tiles."
      />
      <NavCategoryForm />
    </div>
  );
}
