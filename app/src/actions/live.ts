"use server";

import { getLiveSnapshot, type LiveSnapshot } from "../data/live";

/**
 * Re-read the Live View snapshot. Called on an interval by the client so the
 * screen keeps refreshing without a navigation. `getLiveSnapshot` re-runs
 * `requireAdmin()` on every call, so this is not a way around the auth gate.
 */
export async function refreshLiveSnapshot(): Promise<LiveSnapshot> {
  return getLiveSnapshot();
}
