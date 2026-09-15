import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { computeReservationPrice, WASH_TYPE_LABELS, type CarSize, type WashType } from "@/lib/pricing";

// Postgres `time` columns come back as "HH:MM:SS" — trim to "HH:MM" for display.
function normalizeTime<T extends { time: string | null }>(r: T): T {
  return { ...r, time: r.time ? r.time.slice(0, 5) : null };
}

export type Reservation = {
  id: string;
  date: string;
  time: string | null;
  name: string;
  phone: string | null;
  car_num: string | null;
  car_model: string | null;
  loc: string | null;
  note: string | null;
  status: "pending" | "awaiting_payment" | "accepted" | "rejected";
  wash_type: WashType;
  car_size: CarSize;
  price: number | null;
  is_addon: boolean;
  synced_vehicle_id: string | null;
  user_id: string | null;
  created_at: string;
};

export type ReservationInput = {
  date: string;
  time: string | null;
  name: string;
  phone: string;
  car_num: string;
  car_model: string;
  loc: string;
  note: string;
  wash_type: WashType;
  car_size: CarSize;
  is_addon: boolean;
};

export async function listReservations({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}): Promise<Reservation[]> {
  const admin = createAdminClient();
  let query = admin.from("reservations").select("*").order("date", { ascending: true }).order("time", { ascending: true });
  if (!isAdmin) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeTime);
}

/** Reservations synced to a given vehicle, keyed by wash date — used to describe what a scheduled wash-record actually is. */
export async function listReservationsForVehicle(vehicleId: string): Promise<Reservation[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("reservations").select("*").eq("synced_vehicle_id", vehicleId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeTime);
}

export async function getReservation(id: string): Promise<Reservation | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("reservations").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeTime(data) : null;
}

function canAccessReservation(r: Reservation, userId: string, isAdmin: boolean) {
  return isAdmin || r.user_id === userId;
}

/**
 * Runs once a reservation is confirmed (status 'accepted') — links it to a
 * vehicle (reusing one already registered under the same car_num, or
 * creating one) and schedules the wash record. Uses the service-role client
 * directly rather than the `schedule_wash_record` RPC: that RPC is
 * SECURITY DEFINER and checks `vehicles.user_id = auth.uid()`, which only
 * holds when the customer calls it themselves — an admin confirming someone
 * else's reservation has a different auth.uid() and would fail that check.
 */
async function syncVehicleAndScheduleWash(
  admin: ReturnType<typeof createAdminClient>,
  reservation: Reservation,
): Promise<string | null> {
  if (!reservation.user_id || !reservation.car_num) return null;
  const eventDate = new Date(`${reservation.date}T12:00:00.000Z`).toISOString();
  let vehicleId: string | null = null;

  const { data: existingVeh } = await admin
    .from("vehicles")
    .select("id")
    .eq("user_id", reservation.user_id)
    .eq("car_num", reservation.car_num)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingVeh) {
    vehicleId = existingVeh.id;
  } else {
    const price = reservation.price ?? 0;
    const paymentPlan = reservation.is_addon
      ? `구독자 내부세차 추가 (${price.toLocaleString()}원)`
      : `1회 (${reservation.car_size} · ${WASH_TYPE_LABELS[reservation.wash_type]} · ${price.toLocaleString()}원)`;
    const { data: newVeh } = await admin
      .from("vehicles")
      .insert({
        user_id: reservation.user_id,
        car_num: reservation.car_num,
        car_model: reservation.car_model,
        parking_loc: reservation.loc,
        payment_plan: paymentPlan,
        note: reservation.note,
        created_at: eventDate,
      })
      .select()
      .single();
    if (newVeh) vehicleId = newVeh.id;
  }

  if (vehicleId) {
    await admin.from("reservations").update({ synced_vehicle_id: vehicleId }).eq("id", reservation.id);
    const { data: existingRecord } = await admin
      .from("wash_records")
      .select("id")
      .eq("vehicle_id", vehicleId)
      .eq("wash_date", reservation.date)
      .maybeSingle();
    if (!existingRecord) {
      const { error: schedErr } = await admin
        .from("wash_records")
        .insert({ vehicle_id: vehicleId, wash_date: reservation.date, status: "scheduled" });
      if (schedErr) console.error("세차 일정 등록 실패", schedErr);
    }
  }
  return vehicleId;
}

/**
 * TODO(Toss payment): the legacy app never wired real payment for one-time
 * bookings (explicit TODO in app.js). Real payment is still not wired for
 * one-time bookings until TOSS_CLIENT_KEY / TOSS_SECRET_KEY are available
 * (see .env.local.example) — price IS already computed server-side here,
 * never trusted from the client, closing half of that gap in the meantime.
 * Until the payment gate exists, a customer reservation lands as 'pending'
 * (the DB default) and requires an admin to confirm it via
 * setReservationStatus before it counts as a real booking.
 */
export async function createReservation({
  userId,
  isAdmin,
  input,
}: {
  userId: string;
  isAdmin: boolean;
  input: ReservationInput;
}): Promise<Reservation> {
  const admin = createAdminClient();
  const price = computeReservationPrice({ isAddon: input.is_addon, carSize: input.car_size, washType: input.wash_type });

  const payload: Record<string, unknown> = {
    date: input.date,
    time: input.time || null,
    name: input.name,
    phone: input.phone || null,
    car_num: input.car_num || null,
    car_model: input.car_model || null,
    loc: input.loc || null,
    note: input.note || null,
    wash_type: input.wash_type,
    car_size: input.car_size,
    price,
    is_addon: input.is_addon,
    user_id: userId,
  };
  // An admin entering a booking directly (e.g. a phone-in customer) has no
  // one else to confirm it — confirm immediately. A customer's own booking
  // starts 'pending' (DB default) and waits for admin review.
  if (isAdmin) payload.status = "accepted";

  const { data: reservation, error } = await admin.from("reservations").insert(payload).select().single();
  if (error) {
    if (error.code === "23505") throw new Error("이미 예약이 있는 시간입니다. 다른 시간을 선택해주세요");
    throw new Error(error.message);
  }

  if (isAdmin) await syncVehicleAndScheduleWash(admin, normalizeTime(reservation));

  return normalizeTime(reservation);
}

/**
 * Admin-only reservation review. The flow is 신청(pending) → 승인(awaiting_payment)
 * → 결제확인(accepted), with 거절(rejected) reachable from either open state.
 * Vehicle sync + wash scheduling (see syncVehicleAndScheduleWash) only
 * happens on the final awaiting_payment → accepted step, once payment is
 * actually confirmed — not on approval alone. Until Toss is wired for
 * one-time bookings, that confirmation is a manual admin action (bank
 * transfer / cash received, etc.); rejecting undoes a prior accept's
 * schedule, if any, so a mis-click can be corrected.
 */
export async function setReservationStatus({
  id,
  isAdmin,
  status,
}: {
  id: string;
  isAdmin: boolean;
  status: "awaiting_payment" | "accepted" | "rejected";
}): Promise<Reservation> {
  if (!isAdmin) throw new Error("권한이 없습니다");
  const admin = createAdminClient();
  const existing = await getReservation(id);
  if (!existing) throw new Error("예약을 찾을 수 없습니다");

  const { data, error } = await admin.from("reservations").update({ status }).eq("id", id).select().single();
  if (error) {
    if (error.code === "23505") throw new Error("이미 같은 시간에 확정된 예약이 있습니다");
    throw new Error(error.message);
  }
  const updated = normalizeTime(data);

  if (status === "accepted" && !existing.synced_vehicle_id) {
    const vehicleId = await syncVehicleAndScheduleWash(admin, updated);
    updated.synced_vehicle_id = vehicleId;
  }

  if (status === "rejected" && existing.synced_vehicle_id) {
    await admin
      .from("wash_records")
      .delete()
      .eq("vehicle_id", existing.synced_vehicle_id)
      .eq("wash_date", existing.date)
      .eq("status", "scheduled");
  }

  return updated;
}

export async function updateReservation({
  id,
  userId,
  isAdmin,
  input,
}: {
  id: string;
  userId: string;
  isAdmin: boolean;
  input: ReservationInput;
}): Promise<Reservation> {
  const admin = createAdminClient();
  const existing = await getReservation(id);
  if (!existing) throw new Error("예약을 찾을 수 없습니다");
  if (!canAccessReservation(existing, userId, isAdmin)) throw new Error("권한이 없습니다");

  const price = computeReservationPrice({ isAddon: input.is_addon, carSize: input.car_size, washType: input.wash_type });
  const payload = {
    date: input.date,
    time: input.time || null,
    name: input.name,
    phone: input.phone || null,
    car_num: input.car_num || null,
    car_model: input.car_model || null,
    loc: input.loc || null,
    note: input.note || null,
    wash_type: input.wash_type,
    car_size: input.car_size,
    price,
    is_addon: input.is_addon,
  };
  const { data, error } = await admin.from("reservations").update(payload).eq("id", id).select().single();
  if (error) {
    if (error.code === "23505") throw new Error("이미 예약이 있는 시간입니다. 다른 시간을 선택해주세요");
    throw new Error(error.message);
  }

  // Customer moved the date on a synced reservation — move the wash-record too.
  if (!isAdmin && existing.synced_vehicle_id && existing.date !== input.date) {
    const supabase = await createClient();
    await supabase.rpc("unschedule_wash_record", { p_vehicle_id: existing.synced_vehicle_id, p_wash_date: existing.date });
    const { error: schedErr } = await supabase.rpc("schedule_wash_record", {
      p_vehicle_id: existing.synced_vehicle_id,
      p_wash_date: input.date,
    });
    if (schedErr) console.error("세차 일정 이동 실패", schedErr);
  }

  return normalizeTime(data);
}

export async function deleteReservation({
  id,
  userId,
  isAdmin,
}: {
  id: string;
  userId: string;
  isAdmin: boolean;
}): Promise<void> {
  const admin = createAdminClient();
  const existing = await getReservation(id);
  if (!existing) throw new Error("예약을 찾을 수 없습니다");
  if (!canAccessReservation(existing, userId, isAdmin)) throw new Error("권한이 없습니다");

  if (existing.synced_vehicle_id) {
    const supabase = await createClient();
    await supabase.rpc("unschedule_wash_record", { p_vehicle_id: existing.synced_vehicle_id, p_wash_date: existing.date });
  }
  const { error } = await admin.from("reservations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
