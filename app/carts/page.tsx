import { getCustomerCarts } from "@/app/src/data/carts";
import { PageHeader } from "@/app/src/components/ui";
import CartsTable from "@/app/src/components/CartsTable";

export const dynamic = "force-dynamic";

export default async function CartsPage() {
  const carts = await getCustomerCarts();
  const pieces = carts.reduce((n, c) => n + c.pieceCount, 0);

  return (
    <div>
      <PageHeader
        title="Shopping Bags"
        subtitle={
          carts.length === 0
            ? "No active bags"
            : `${carts.length} active ${carts.length === 1 ? "bag" : "bags"} · ${pieces} ${pieces === 1 ? "piece" : "pieces"}`
        }
      />
      <CartsTable carts={carts} />
    </div>
  );
}
