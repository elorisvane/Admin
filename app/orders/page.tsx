import { getOrders } from "@/app/src/data/orders";
import { PageHeader } from "@/app/src/components/ui";
import OrdersTable from "@/app/src/components/OrdersTable";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await getOrders();
  const pending = orders.filter((o) => o.status === "pending").length;

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={
          orders.length === 0
            ? "No orders yet"
            : `${orders.length} order${orders.length === 1 ? "" : "s"}` +
              (pending ? ` · ${pending} awaiting confirmation` : "")
        }
      />
      <OrdersTable orders={orders} />
    </div>
  );
}
