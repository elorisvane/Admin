import { getUsers } from "@/app/src/data/users";
import { getOrders } from "@/app/src/data/orders";
import { PageHeader } from "@/app/src/components/ui";
import UsersTable, { type UserRow } from "@/app/src/components/UsersTable";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, orders] = await Promise.all([getUsers(), getOrders()]);

  // Tally each customer's orders by their auth user id.
  const orderCounts = new Map<string, number>();
  for (const o of orders) {
    orderCounts.set(o.userId, (orderCounts.get(o.userId) ?? 0) + 1);
  }

  const rows: UserRow[] = users.map((u) => ({
    ...u,
    orderCount: orderCounts.get(u.id) ?? 0,
  }));

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${users.length} registered ${
          users.length === 1 ? "account" : "accounts"
        }`}
      />
      <UsersTable users={rows} />
    </div>
  );
}
