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
  status: "pending" | "accepted" | "rejected";
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
 * TODO(Toss payment): the legacy app never wired real payment for one-time
 * bookings (explicit TODO in app.js) — new customer reservations were
 * auto-accepted. Same behavior is kept here until real TOSS_CLIENT_KEY /
 * TOSS_SECRET_KEY are available (see .env.local.example); the actual
 * security fix planned for this migration is a server-side Toss payment
 * confirmation gate before flipping status to 'accepted', which needs
 * those keys to build and test against. Price IS already computed
 * server-side here, never trusted from the client, closing that half of
 * the gap in the meantime.
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
  const isNewCustomerBooking = !isAdmin;

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
  if (isNewCustomerBooking) payload.status = "accepted";

  const { data: reservation, error } = await admin.from("reservations").insert(payload).select().single();
  if (error) throw new Error(error.message);

  // Paid one-time bookings auto-sync into a vehicle + scheduled wash record,
  // same as the legacy admin "고객차량 관리" calendar integration.
  if (isNewCustomerBooking) {
    const eventDate = new Date(`${input.date}T12:00:00.000Z`).toISOString();
    let vehicleId: string | null = null;

    const { data: existingVeh } = await admin
      .from("vehicles")
      .select("id")
      .eq("user_id", userId)
      .eq("car_num", input.car_num)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingVeh) {
      vehicleId = existingVeh.id;
    } else {
      const paymentPlan = input.is_addon
        ? `구독자 내부세차 추가 (${price.toLocaleString()}원)`
        : `1회 (${input.car_size} · ${WASH_TYPE_LABELS[input.wash_type]} · ${price.toLocaleString()}원)`;
      const { data: newVeh } = await admin
        .from("vehicles")
        .insert({
          user_id: userId,
          car_num: input.car_num || null,
          car_model: input.car_model || null,
          parking_loc: input.loc || null,
          payment_plan: paymentPlan,
          note: input.note || null,
          created_at: eventDate,
        })
        .select()
        .single();
      if (newVeh) vehicleId = newVeh.id;
    }

    if (vehicleId) {
      await admin.from("reservations").update({ synced_vehicle_id: vehicleId }).eq("id", reservation.id);
      reservation.synced_vehicle_id = vehicleId;
      // schedule_wash_record is SECURITY DEFINER and checks
      // vehicles.user_id = auth.uid() internally — must run with the
      // caller's own session (the admin/service-role client has no
      // auth.uid(), so the ownership check would silently fail).
      const supabase = await createClient();
      const { error: schedErr } = await supabase.rpc("schedule_wash_record", {
        p_vehicle_id: vehicleId,
        p_wash_date: input.date,
      });
      if (schedErr) console.error("세차 일정 등록 실패", schedErr);
    }
  }

  return normalizeTime(reservation);
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
  if (error) throw new Error(error.message);

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
