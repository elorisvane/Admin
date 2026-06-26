import { getSavedCreations } from "@/app/src/data/wishlists";
import { PageHeader } from "@/app/src/components/ui";
import WishlistsTable from "@/app/src/components/WishlistsTable";

export const dynamic = "force-dynamic";

export default async function WishlistsPage() {
  const saved = await getSavedCreations();
  const customerCount = new Set(saved.map((s) => s.userId)).size;

  return (
    <div>
      <PageHeader
        title="Saved Creations"
        subtitle={
          saved.length === 0
            ? "No saved creations yet"
            : `${saved.length} ${saved.length === 1 ? "save" : "saves"} across ${customerCount} ${customerCount === 1 ? "customer" : "customers"}`
        }
      />
      <WishlistsTable rows={saved} />
    </div>
  );
}
