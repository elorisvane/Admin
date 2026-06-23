import HomeMediaForm from "@/app/src/components/HomeMediaForm";
import { PageHeader } from "@/app/src/components/ui";

export default function NewHomeMediaPage() {
  return (
    <div>
      <PageHeader
        title="New home media"
        subtitle="Add an image or video to the storefront home page."
      />
      <HomeMediaForm />
    </div>
  );
}
