import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { listVehicles } from "@/lib/data/vehicles";
import type { CarSize } from "@/lib/pricing";

export type SubscriptionPlan = {
  id: string;
  name: string;
  frequency_label: string;
  price: number;
  active: boolean;
  car_size: CarSize;
  frequency: "weekly" | "twice_weekly" | "biweekly";
  visits_per_month: number;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "pending" | "past_due" | "canceled";
  next_billing_date: string | null;
  created_at: string;
  synced_vehicle_id: string | null;
  auto_renew: boolean;
};

export async function listActivePlans(): Promise<SubscriptionPlan[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("subscription_plans").select("*").eq("active", true).order("price");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMySubscription(userId: string): Promise<Subscription | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscriptions_public")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** The subscription synced to a given vehicle, plus its plan — used to describe subscription-type wash records. */
export async function getSubscriptionForVehicle(
  vehicleId: string,
): Promise<{ subscription: Subscription; plan: SubscriptionPlan | null } | null> {
  const admin = createAdminClient();
  const { data: subscription } = await admin
    .from("subscriptions_public")
    .select("*")
    .eq("synced_vehicle_id", vehicleId)
    .maybeSingle();
  if (!subscription) return null;
  const { data: plan } = await admin.from("subscription_plans").select("*").eq("id", subscription.plan_id).maybeSingle();
  return { subscription, plan: plan ?? null };
}

export async function listAllSubscriptions(): Promise<Subscription[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("subscriptions_public").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSubscriptionUsageCount(vehicleId: string): Promise<number> {
  const admin = createAdminClient();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const { count, error } = await admin
    .from("wash_records")
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", vehicleId)
    .gte("wash_date", monthStart);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Links a subscription to a vehicle when the subscriber has exactly one
 * registered vehicle (the common case) — copies it into a fresh admin-
 * tracked vehicle row, same as the legacy syncVehicleForSubscription().
 *
 * BUG FIX: the legacy version inserted the new vehicle with the calling
 * ADMIN's own user_id instead of the subscriber's — so a synced vehicle
 * ended up attributed to whichever admin confirmed it, not the customer.
 * Fixed here to use `sub.user_id`.
 */
export async function confirmSubscriptionSync(
  subscriptionId: string,
): Promise<{ ok: true } | { ok: false; reason: "no_vehicle" | "multiple_vehicles" | "not_found" }> {
  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("*").eq("id", subscriptionId).maybeSingle();
  if (!sub) return { ok: false, reason: "not_found" };

  const custVehicles = await listVehicles({ userId: sub.user_id, isAdmin: false });
  if (custVehicles.length !== 1) {
    return { ok: false, reason: custVehicles.length === 0 ? "no_vehicle" : "multiple_vehicles" };
  }
  const v = custVehicles[0];

  const { data: plan } = await admin.from("subscription_plans").select("*").eq("id", sub.plan_id).maybeSingle();
  const { data: newVeh, error } = await admin
    .from("vehicles")
    .insert({
      user_id: sub.user_id,
      car_num: v.car_num || null,
      car_model: v.car_model || null,
      parking_loc: v.parking_loc || null,
      payment_plan: plan ? plan.name : null,
      note: v.note || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const { error: linkErr } = await admin
    .from("subscriptions")
    .update({ synced_vehicle_id: newVeh.id })
    .eq("id", subscriptionId);
  if (linkErr) throw new Error(linkErr.message);

  return { ok: true };
}
