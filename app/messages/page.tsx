import { getMessages } from "@/app/src/data/messages";
import { PageHeader } from "@/app/src/components/ui";
import MessagesTable from "@/app/src/components/MessagesTable";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const messages = await getMessages();
  const unread = messages.filter((m) => m.status === "new").length;

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle={
          messages.length === 0
            ? "No enquiries yet"
            : `${messages.length} enquir${messages.length === 1 ? "y" : "ies"}` +
              (unread ? ` · ${unread} new` : "")
        }
      />
      <MessagesTable messages={messages} />
    </div>
  );
}
