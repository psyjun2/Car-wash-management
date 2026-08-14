import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getServiceAreaLines(): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("site_settings").select("value").eq("key", "service_area").maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.value as { lines?: string[] } | null)?.lines ?? [];
}
