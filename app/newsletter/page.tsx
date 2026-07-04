import { getSubscribers } from "@/app/src/data/newsletter";
import { PageHeader } from "@/app/src/components/ui";
import SubscribersTable from "@/app/src/components/SubscribersTable";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const subscribers = await getSubscribers();
  const active = subscribers.filter((s) => s.status === "subscribed").length;

  return (
    <div>
      <PageHeader
        title="Newsletter"
        subtitle={
          subscribers.length === 0
            ? "No subscribers yet"
            : `${subscribers.length} subscriber${subscribers.length === 1 ? "" : "s"}` +
              (active !== subscribers.length ? ` · ${active} active` : "")
        }
      />
      <SubscribersTable subscribers={subscribers} />
    </div>
  );
}
