"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refresh the current route's server components once on mount.
 *
 * Used after a successful top-up: the credit balance lives in the (app) layout,
 * which Next.js keeps cached across client navigations. Refreshing here makes
 * the header CreditPill pick up the new balance before the user navigates away.
 */
export function RefreshOnMount() {
  const router = useRouter();
  useEffect(() => {
    router.refresh();
  }, [router]);
  return null;
}
