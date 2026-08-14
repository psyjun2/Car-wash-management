import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type GalleryItem = {
  id: string;
  title: string;
  sub: string | null;
  before_photo_url: string;
  before_alt: string | null;
  after_photo_url: string;
  after_alt: string | null;
  sort_order: number;
};

export async function listGalleryItems(): Promise<GalleryItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("gallery_items").select("*").order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
