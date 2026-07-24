import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVehicle } from "@/lib/data/vehicles";

export type WashRecordPhoto = {
  id: string;
  wash_record_id: string;
  photo_url: string;
  storage_path: string;
};

export type WashRecord = {
  id: string;
  vehicle_id: string;
  wash_date: string;
  status: "scheduled" | "washing" | "done";
  service_type: "onetime" | "subscription";
  note: string | null;
  created_at: string;
  wash_record_photos?: WashRecordPhoto[];
};

const BUCKET = "vehicle-photos";

// TODO(storage-privacy): bucket is currently public, matching legacy
// behavior. If it's converted to private, swap this for
// `admin.storage.from(BUCKET).createSignedUrl(path, ttlSeconds)` and existing
// stored photo_url values need a one-time backfill/regeneration pass.
function publicPhotoUrl(admin: ReturnType<typeof createAdminClient>, path: string) {
  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function assertVehicleAccess(vehicleId: string, userId: string, isAdmin: boolean) {
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) throw new Error("차량을 찾을 수 없습니다");
  if (!isAdmin && vehicle.user_id !== userId) throw new Error("권한이 없습니다");
  return vehicle;
}

export async function listWashRecords({
  vehicleId,
  userId,
  isAdmin,
}: {
  vehicleId: string;
  userId: string;
  isAdmin: boolean;
}): Promise<WashRecord[]> {
  await assertVehicleAccess(vehicleId, userId, isAdmin);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("wash_records")
    .select("*, wash_record_photos(*)")
    .eq("vehicle_id", vehicleId)
    .order("wash_date", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

function requireAdmin(isAdmin: boolean) {
  if (!isAdmin) throw new Error("관리자만 가능합니다");
}

export async function upsertWashRecord({
  isAdmin,
  vehicleId,
  washDate,
  serviceType,
  status,
  note,
}: {
  isAdmin: boolean;
  vehicleId: string;
  washDate: string;
  serviceType: "onetime" | "subscription";
  status: "scheduled" | "washing" | "done";
  note: string | null;
}): Promise<WashRecord> {
  requireAdmin(isAdmin);
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("wash_records")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .eq("wash_date", washDate)
    .maybeSingle();

  const payload = { service_type: serviceType, status, note: note || null };
  if (existing) {
    const { data, error } = await admin
      .from("wash_records")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
  const { data, error } = await admin
    .from("wash_records")
    .insert({ vehicle_id: vehicleId, wash_date: washDate, ...payload })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Lazily creates a bare `scheduled` record for a date, e.g. before a photo attaches to it. */
export async function ensureWashRecord({
  isAdmin,
  vehicleId,
  washDate,
}: {
  isAdmin: boolean;
  vehicleId: string;
  washDate: string;
}): Promise<WashRecord> {
  requireAdmin(isAdmin);
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("wash_records")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .eq("wash_date", washDate)
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await admin
    .from("wash_records")
    .insert({ vehicle_id: vehicleId, wash_date: washDate })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteWashRecord({ isAdmin, id }: { isAdmin: boolean; id: string }) {
  requireAdmin(isAdmin);
  const admin = createAdminClient();
  const { data: record } = await admin
    .from("wash_records")
    .select("*, wash_record_photos(*)")
    .eq("id", id)
    .maybeSingle();
  const paths = (record?.wash_record_photos ?? []).map((p: WashRecordPhoto) => p.storage_path);
  if (paths.length) await admin.storage.from(BUCKET).remove(paths);
  const { error } = await admin.from("wash_records").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addWashRecordPhoto({
  isAdmin,
  washRecordId,
  vehicleId,
  fileName,
  fileBuffer,
  contentType,
}: {
  isAdmin: boolean;
  washRecordId: string;
  vehicleId: string;
  fileName: string;
  fileBuffer: Buffer;
  contentType: string;
}): Promise<WashRecordPhoto> {
  requireAdmin(isAdmin);
  const admin = createAdminClient();
  const ext = (fileName.split(".").pop() || "jpg").toLowerCase();
  const path = `${vehicleId}/${washRecordId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, fileBuffer, { contentType });
  if (uploadError) throw new Error(uploadError.message);

  const photoUrl = publicPhotoUrl(admin, path);
  const { data, error } = await admin
    .from("wash_record_photos")
    .insert({ wash_record_id: washRecordId, photo_url: photoUrl, storage_path: path })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteWashRecordPhoto({
  isAdmin,
  id,
  storagePath,
}: {
  isAdmin: boolean;
  id: string;
  storagePath: string;
}) {
  requireAdmin(isAdmin);
  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove([storagePath]);
  const { error } = await admin.from("wash_record_photos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
