import { redirect } from "next/navigation";

/**
 * Account settings live in the Settings modal (opened from the user menu), so
 * the standalone page is consolidated away to avoid a duplicate settings UI.
 * Any direct visit is sent back to the dashboard.
 */
export default function SettingsPage() {
  redirect("/dashboard");
}
