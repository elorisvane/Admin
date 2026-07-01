import { getSiteSettings } from "@/app/src/data/settings";
import { PageHeader } from "@/app/src/components/ui";
import ComingSoonSettings from "@/app/src/components/ComingSoonSettings";

export const dynamic = "force-dynamic";

export default async function ComingSoonPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <PageHeader
        title="Site Availability"
        subtitle="Lock the storefront behind a Coming Soon page, or take it live."
      />
      <ComingSoonSettings settings={settings} />
    </div>
  );
}
