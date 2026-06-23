import { supabaseAdmin } from "../lib/supabaseAdmin";

export type MessageStatus = "new" | "read" | "archived";

export const MESSAGE_STATUSES: MessageStatus[] = ["new", "read", "archived"];

export interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  message: string;
  status: MessageStatus;
  createdAt: string;
}

interface MessageRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  message: string;
  status: MessageStatus;
  created_at: string;
}

function mapMessage(row: MessageRow): ContactMessage {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Every contact-form enquiry, newest first. Read with the service-role client:
 * `contact_messages` has no public SELECT policy, so only the atelier sees them.
 */
export async function getMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabaseAdmin
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapMessage);
}
