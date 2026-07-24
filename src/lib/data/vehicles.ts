import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type Vehicle = {
  id: string;
  user_id: string;
  car_num: string;
  car_model: string | null;
  created_at: string;
  parking_loc: string | null;
  payment_plan: string | null;
  wash_status: "washing" | "done" | null;
  note: string | null;
};

export type VehicleInput = {
  car_num: string;
  car_model: string | null;
  // Admin-only fields — ignored server-side unless the caller is an admin.
  parking_loc?: string | null;
  payment_plan?: string | null;
  wash_status?: string | null;
  note?: string | null;
};

/**
 * Ownership is enforced here, not by RLS: admins see every row, everyone
 * else only ever gets rows filtered to their own `user_id` in the query
 * itself — the client never receives (and therefore can never accidentally
 * leak-via-client-filter) another user's vehicles.
 */
export async function listVehicles({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}): Promise<Vehicle[]> {
  const admin = createAdminClient();
  let query = admin.from("vehicles").select("*").order("created_at", { ascending: true });
  if (!isAdmin) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("vehicles").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

function canAccessVehicle(vehicle: Vehicle, userId: string, isAdmin: boolean) {
  return isAdmin || vehicle.user_id === userId;
}

export async function createVehicle({
  userId,
  isAdmin,
  input,
}: {
  userId: string;
  isAdmin: boolean;
  input: VehicleInput;
}): Promise<Vehicle> {
  const admin = createAdminClient();
  const payload: Record<string, unknown> = {
    car_num: input.car_num,
    car_model: input.car_model || null,
    user_id: userId, // never trust a client-sent user_id
  };
  if (isAdmin) {
    payload.parking_loc = input.parking_loc || null;
    payload.payment_plan = input.payment_plan || null;
    payload.wash_status = input.wash_status || null;
    payload.note = input.note || null;
  }
  const { data, error } = await admin.from("vehicles").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateVehicle({
  id,
  userId,
  isAdmin,
  input,
}: {
  id: string;
  userId: string;
  isAdmin: boolean;
  input: VehicleInput;
}): Promise<Vehicle> {
  const admin = createAdminClient();
  const existing = await getVehicle(id);
  if (!existing) throw new Error("차량을 찾을 수 없습니다");
  if (!canAccessVehicle(existing, userId, isAdmin)) throw new Error("권한이 없습니다");

  const payload: Record<string, unknown> = {
    car_num: input.car_num,
    car_model: input.car_model || null,
  };
  if (isAdmin) {
    payload.parking_loc = input.parking_loc || null;
    payload.payment_plan = input.payment_plan || null;
    payload.wash_status = input.wash_status || null;
    payload.note = input.note || null;
  }
  const { data, error } = await admin.from("vehicles").update(payload).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteVehicle({
  id,
  userId,
  isAdmin,
}: {
  id: string;
  userId: string;
  isAdmin: boolean;
}): Promise<void> {
  const admin = createAdminClient();
  const existing = await getVehicle(id);
  if (!existing) throw new Error("차량을 찾을 수 없습니다");
  if (!canAccessVehicle(existing, userId, isAdmin)) throw new Error("권한이 없습니다");

  const { data: photos } = await admin
    .from("wash_record_photos")
    .select("storage_path, wash_records!inner(vehicle_id)")
    .eq("wash_records.vehicle_id", id);
  const paths = (photos ?? []).map((p) => p.storage_path).filter(Boolean);
  if (paths.length) await admin.storage.from("vehicle-photos").remove(paths);

  const { error } = await admin.from("vehicles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
