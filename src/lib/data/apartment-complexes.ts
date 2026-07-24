import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type ApartmentComplex = {
  id: string;
  name: string;
  created_at: string;
};

// Admin-only in the legacy app (RLS restricted SELECT/INSERT to admins) —
// callers must check isAdmin before calling these.
export async function listApartmentComplexes(): Promise<ApartmentComplex[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("apartment_complexes").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createApartmentComplex(name: string): Promise<ApartmentComplex> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("apartment_complexes")
    .insert({ name })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
