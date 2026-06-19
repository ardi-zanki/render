"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Surfaces the outcome of a Google account-link attempt. Linking uses a full
 * OAuth redirect, so the Settings modal is gone by the time the user returns;
 * better-auth lands them on `/dashboard?google=linked|link-error`. This reads
 * that param, shows a toast, then strips it so a refresh won't repeat it.
 */
export function GoogleLinkToast() {
  const params = useSearchParams();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    const status = params.get("google");
    if (!status || handled.current) return;
    handled.current = true;

    if (status === "linked") {
      toast.success("Akun Google berhasil dihubungkan");
      router.refresh();
    } else if (status === "link-error") {
      toast.error(
        "Gagal menghubungkan Google. Pastikan akun Google memakai email yang sama dengan akun ini.",
      );
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("google");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }, [params, router]);

  return null;
}
