// Supabase Edge Function: 매일 pg_cron이 호출 — 청구일 지난 구독을 정기 청구
// 배포: supabase functions deploy charge-due-subscriptions
// 시크릿: supabase secrets set TOSS_SECRET_KEY=...
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY")!;

function tossAuthHeader() {
  return "Basic " + btoa(`${TOSS_SECRET_KEY}:`);
}

serve(async (_req) => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  const { data: dueSubs, error } = await admin
    .from("subscriptions")
    .select("*, subscription_plans(*)")
    .eq("status", "active")
    .lte("next_billing_date", today);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results: { subscriptionId: string; ok: boolean }[] = [];

  for (const sub of dueSubs ?? []) {
    const plan = sub.subscription_plans;
    if (!plan || plan.price <= 0) continue;

    const orderId = crypto.randomUUID();
    const chargeRes = await fetch(`https://api.tosspayments.com/v1/billing/${sub.billing_key}`, {
      method: "POST",
      headers: { Authorization: tossAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        customerKey: sub.toss_customer_key,
        amount: plan.price,
        orderId,
        orderName: plan.name,
      }),
    });
    const chargeData = await chargeRes.json();

    await admin.from("subscription_payments").insert({
      subscription_id: sub.id,
      amount: plan.price,
      toss_payment_key: chargeData.paymentKey || null,
      status: chargeRes.ok ? "paid" : "failed",
    });

    if (chargeRes.ok) {
      const next = new Date(sub.next_billing_date);
      next.setMonth(next.getMonth() + 1);
      await admin
        .from("subscriptions")
        .update({ next_billing_date: next.toISOString().slice(0, 10) })
        .eq("id", sub.id);
    } else {
      await admin.from("subscriptions").update({ status: "past_due" }).eq("id", sub.id);
    }

    results.push({ subscriptionId: sub.id, ok: chargeRes.ok });
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
