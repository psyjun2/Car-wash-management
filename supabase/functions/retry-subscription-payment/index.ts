// Supabase Edge Function: 고객이 "재결제" 버튼을 눌렀을 때, 기존 billingKey로 즉시 재청구
// (연체(past_due) 상태의 구독을 고객이 직접 재결제할 수 있게 함)
// 배포: supabase functions deploy retry-subscription-payment
// 시크릿: supabase secrets set TOSS_SECRET_KEY=...
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY")!;

function tossAuthHeader() {
  return "Basic " + btoa(`${TOSS_SECRET_KEY}:`);
}

function addOneMonth(d: Date): string {
  const n = new Date(d);
  n.setMonth(n.getMonth() + 1);
  return n.toISOString().slice(0, 10);
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "인증이 필요합니다" }), { status: 401 });
    }
    const user = userData.user;

    const { subscriptionId } = await req.json();
    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: "필수 파라미터 누락" }), { status: 400 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: sub, error: subErr } = await admin
      .from("subscriptions")
      .select("*, subscription_plans(*)")
      .eq("id", subscriptionId)
      .single();
    if (subErr || !sub) {
      return new Response(JSON.stringify({ error: "구독을 찾을 수 없습니다" }), { status: 404 });
    }
    if (sub.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "본인 구독만 재결제할 수 있습니다" }), { status: 403 });
    }

    const plan = sub.subscription_plans;
    if (!plan || plan.price <= 0) {
      return new Response(JSON.stringify({ error: "결제할 금액이 없습니다" }), { status: 400 });
    }

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

    if (!chargeRes.ok) {
      return new Response(JSON.stringify({ error: chargeData.message || "결제에 실패했습니다" }), { status: 400 });
    }

    await admin
      .from("subscriptions")
      .update({ status: "active", next_billing_date: addOneMonth(new Date()) })
      .eq("id", sub.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
