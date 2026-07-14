import { getLiveSnapshot } from "@/app/src/data/live";
import LiveView from "@/app/src/components/LiveView";

// Always a fresh snapshot on load; the client then polls to keep it current.
export const dynamic = "force-dynamic";

// Full-bleed: LiveView renders its own header inside the left pane so the globe
// can run to the edge of the viewport (see FULL_BLEED_ROUTES in AppShell).
export default async function LiveViewPage() {
  const snapshot = await getLiveSnapshot();
  return <LiveView initial={snapshot} />;
}
