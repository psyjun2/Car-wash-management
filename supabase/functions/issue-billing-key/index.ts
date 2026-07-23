// Supabase Edge Function: 토스페이먼츠 authKey → billingKey 발급 + 첫 결제
// 배포: supabase functions deploy issue-billing-key
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

    const { authKey, customerKey, planId, updateSubscriptionId } = await req.json();
    if (!authKey || !customerKey || (!planId && !updateSubscriptionId)) {
      return new Response(JSON.stringify({ error: "필수 파라미터 누락" }), { status: 400 });
    }
    if (customerKey !== user.id) {
      return new Response(JSON.stringify({ error: "customerKey가 일치하지 않습니다" }), { status: 403 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1) authKey -> billingKey 발급
    const issueRes = await fetch("https://api.tosspayments.com/v1/billing/authorizations/issue", {
      method: "POST",
      headers: { Authorization: tossAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ authKey, customerKey }),
    });
    const issueData = await issueRes.json();
    if (!issueRes.ok) {
      return new Response(JSON.stringify({ error: issueData.message || "빌링키 발급 실패" }), { status: 400 });
    }
    const billingKey = issueData.billingKey;

    // 1-b) 카드 변경 모드: 신규 구독 생성 없이, 본인 소유 기존 구독의 billingKey만 교체
    if (updateSubscriptionId) {
      const { data: existingSub, error: existErr } = await admin
        .from("subscriptions")
        .select("id, user_id")
        .eq("id", updateSubscriptionId)
        .single();
      if (existErr || !existingSub || existingSub.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "본인 구독만 카드를 변경할 수 있습니다" }), { status: 403 });
      }
      const { error: updErr } = await admin
        .from("subscriptions")
        .update({ billing_key: billingKey, toss_customer_key: customerKey })
        .eq("id", updateSubscriptionId);
      if (updErr) {
        return new Response(JSON.stringify({ error: updErr.message }), { status: 500 });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2) 플랜 조회
    const { data: plan, error: planErr } = await admin
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();
    if (planErr || !plan) {
      return new Response(JSON.stringify({ error: "플랜을 찾을 수 없습니다" }), { status: 400 });
    }

    // 3) 구독 row 생성
    const { data: sub, error: subErr } = await admin
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: "active",
        billing_key: billingKey,
        toss_customer_key: customerKey,
        next_billing_date: addOneMonth(new Date()),
      })
      .select()
      .single();
    if (subErr) {
      return new Response(JSON.stringify({ error: subErr.message }), { status: 500 });
    }

    // 4) 첫 결제 즉시 청구 (가격이 설정된 경우에만)
    if (plan.price > 0) {
      const orderId = crypto.randomUUID();
      const chargeRes = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
        method: "POST",
        headers: { Authorization: tossAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ customerKey, amount: plan.price, orderId, orderName: plan.name }),
      });
      const chargeData = await chargeRes.json();
      await admin.from("subscription_payments").insert({
        subscription_id: sub.id,
        amount: plan.price,
        toss_payment_key: chargeData.paymentKey || null,
        status: chargeRes.ok ? "paid" : "failed",
      });
      if (!chargeRes.ok) {
        await admin.from("subscriptions").update({ status: "past_due" }).eq("id", sub.id);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
