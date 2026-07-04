import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";

export type SubscriberStatus = "subscribed" | "unsubscribed";

export const SUBSCRIBER_STATUSES: SubscriberStatus[] = [
  "subscribed",
  "unsubscribed",
];

export interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  status: SubscriberStatus;
  createdAt: string;
}

interface SubscriberRow {
  id: string;
  email: string;
  source: string | null;
  status: SubscriberStatus;
  created_at: string;
}

function mapSubscriber(row: SubscriberRow): Subscriber {
  return {
    id: row.id,
    email: row.email,
    source: row.source,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Every newsletter subscriber, newest first. Read with the service-role client:
 * `newsletter_subscribers` has no public SELECT policy, so only the atelier
 * sees the list.
 */
export async function getSubscribers(): Promise<Subscriber[]> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSubscriber);
}
