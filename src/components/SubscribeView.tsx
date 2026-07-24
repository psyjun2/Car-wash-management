"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SubscriptionPlan, Subscription } from "@/lib/data/subscriptions";
import { WASH_PRICES, SUB_FREQ_DISCOUNT, SUB_PLAN_NAME, SUB_PLAN_TIER, type CarSize, type WashType, type SubFrequency } from "@/lib/pricing";
import { useToast } from "@/components/Toast";
import { ConfirmModal } from "@/components/ConfirmModal";

const CAR_SIZES: CarSize[] = ["소형", "중형", "대형"];
const WASH_OPTIONS: { type: WashType; name: string }[] = [
  { type: "exterior", name: "외부세차만" },
  { type: "interior", name: "내부세차만" },
  { type: "both", name: "외부+내부세차" },
];
const STATUS_LABELS: Record<string, string> = { active: "활성", pending: "대기", past_due: "연체", canceled: "해지" };

function round1000(n: number) {
  return Math.round(n / 1000) * 1000;
}

const TOSS_READY = !!process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

type Props = {
  isAdmin: boolean;
  plans: SubscriptionPlan[];
  mySubscription: Subscription | null;
  allSubscriptions: Subscription[];
};

export function SubscribeView({ isAdmin, plans, mySubscription, allSubscriptions }: Props) {
  const router = useRouter();
  const showToast = useToast();
  const [selectedCarSize, setSelectedCarSize] = useState<CarSize>(
    (mySubscription && plans.find((p) => p.id === mySubscription.plan_id)?.car_size) || "소형",
  );
  const [washType, setWashType] = useState<WashType | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const plansForSize = plans.filter((p) => p.car_size === selectedCarSize);
  // Nothing pre-selected — the customer picks a plan and wash type themselves.
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const selectedPlan = plansForSize.find((p) => p.id === selectedPlanId) ?? null;

  function handleSelectCarSize(size: CarSize) {
    setSelectedCarSize(size);
    setSelectedPlanId(null);
    setWashType(null);
  }

  const priceFor = useMemo(() => {
    if (!selectedPlan || selectedPlan.price <= 0) return null;
    const discount = SUB_FREQ_DISCOUNT[selectedPlan.frequency as SubFrequency] || 0;
    const oneTime = WASH_PRICES[selectedCarSize];
    const visits = selectedPlan.visits_per_month || 0;
    return {
      exterior: selectedPlan.price,
      interior: round1000(oneTime.interior * (1 - discount) * visits),
      both: round1000(oneTime.both * (1 - discount) * visits),
    };
  }, [selectedPlan, selectedCarSize]);

  async function guardToss() {
    if (!TOSS_READY) {
      showToast("결제 연동이 아직 설정되지 않았습니다. 관리자에게 문의해주세요");
      return false;
    }
    return true;
  }

  async function handleApply() {
    if (!selectedPlanId) {
      showToast("멤버십 서비스를 선택해주세요");
      return;
    }
    if (!washType) {
      showToast("세차 종류를 선택해주세요");
      return;
    }
    // TODO(Toss): once NEXT_PUBLIC_TOSS_CLIENT_KEY / TOSS_SECRET_KEY exist,
    // wire the PaymentWidget billing-auth flow here (see legacy app.js
    // applySubscription / handleBillingRedirect for the reference flow).
    await guardToss();
  }

  async function handleChangeCard() {
    await guardToss();
  }

  async function handleRetryPayment() {
    await guardToss();
  }

  async function handleToggleAutoRenew() {
    if (!mySubscription) return;
    setPending(true);
    const res = await fetch(`/api/subscriptions/${mySubscription.id}/auto-renew`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoRenew: !mySubscription.auto_renew }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json();
      showToast("변경 실패: " + (data.error ?? "알 수 없는 오류"));
      return;
    }
    showToast(!mySubscription.auto_renew ? "✅ 자동결제가 켜졌습니다" : "⏸️ 자동결제가 꺼졌습니다");
    router.refresh();
  }

  async function handleCancel() {
    if (!mySubscription) return;
    setPending(true);
    const res = await fetch(`/api/subscriptions/${mySubscription.id}/cancel`, { method: "POST" });
    setPending(false);
    if (!res.ok) {
      const data = await res.json();
      showToast("취소 실패: " + (data.error ?? "알 수 없는 오류"));
      return;
    }
    setCancelOpen(false);
    showToast("🗑️ 구독이 취소되었습니다");
    router.refresh();
  }

  async function handleConfirmSync(subscriptionId: string) {
    setPending(true);
    const res = await fetch(`/api/subscriptions/${subscriptionId}/confirm`, { method: "POST" });
    setPending(false);
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error ?? "연동 실패");
      return;
    }
    showToast("✅ 캘린더에 연동되었습니다");
    router.refresh();
  }

  if (isAdmin) {
    return (
      <div id="sub-admin-list">
        {allSubscriptions.length === 0 ? (
          <div className="resv-empty">📭 구독 신청 내역이 없습니다</div>
        ) : (
          allSubscriptions.map((s) => {
            const plan = plans.find((p) => p.id === s.plan_id);
            return (
              <div className="veh-card" key={s.id}>
                <div className="veh-card-top">
                  <div className="veh-card-info">
                    <div className="veh-card-num">{plan ? plan.name : "플랜 정보 없음"}</div>
                    <div className="veh-card-model">고객 ID: {s.user_id.slice(0, 8)}</div>
                  </div>
                  <div className={`veh-status-badge${s.status === "active" ? " done" : ""}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </div>
                </div>
                {s.next_billing_date && <div className="veh-card-note">다음 결제일: {s.next_billing_date}</div>}
                {s.status === "active" && (
                  <div className="veh-record-actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <div className="veh-card-note">💳 결제완료</div>
                    {s.synced_vehicle_id ? (
                      <div className="resv-status-badge accepted">✅ 캘린더 연동됨</div>
                    ) : (
                      <button className="resv-save-btn" onClick={() => handleConfirmSync(s.id)} disabled={pending}>
                        확인
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  const subStatus = mySubscription?.status ?? null;
  const isActiveOrPastDue = subStatus === "active" || subStatus === "past_due";
  const isPastDue = subStatus === "past_due";
  const currentPlan = mySubscription ? plans.find((p) => p.id === mySubscription.plan_id) : null;

  return (
    <>
      {isActiveOrPastDue && mySubscription && (
        <div className="sub-status">
          <div className={`sub-status-active${isPastDue ? " past-due" : ""}`}>
            <div className="sub-status-label">{isPastDue ? "⚠️ 결제 실패 · 재결제가 필요해요" : "✅ 현재 구독 상품"}</div>
            <div className="sub-status-plan">{currentPlan ? currentPlan.name : "구독 플랜"}</div>
            {mySubscription.next_billing_date && (
              <div className="sub-status-billing">다음 결제일: {mySubscription.next_billing_date}</div>
            )}
          </div>
        </div>
      )}

      {isActiveOrPastDue && mySubscription && (
        <div className="sub-manage-box">
          {isPastDue && (
            <button className="sub-manage-btn primary" onClick={handleRetryPayment} disabled={pending}>
              재결제
            </button>
          )}
          {!isPastDue && (
            <div className="sub-manage-row">
              <div className="sub-manage-label">자동결제</div>
              <div className={`vw-toggle${mySubscription.auto_renew ? " on" : ""}`} onClick={handleToggleAutoRenew} />
            </div>
          )}
          <div className="sub-manage-btns">
            <button className="sub-manage-btn" onClick={handleChangeCard} disabled={pending}>
              카드 변경
            </button>
            <button className="sub-manage-btn danger" onClick={() => setCancelOpen(true)} disabled={pending}>
              취소하기
            </button>
          </div>
        </div>
      )}

      <div className="mg-label">차급 선택</div>
      <div className="sub-size-tabs">
        {CAR_SIZES.map((sz) => (
          <div key={sz} className={`sub-size-tab${sz === selectedCarSize ? " selected" : ""}`} onClick={() => handleSelectCarSize(sz)}>
            {sz}
          </div>
        ))}
      </div>

      <div className="mg-label">멤버십 서비스</div>
      <div className="sub-plan-list">
        {plansForSize.map((p) => {
          const freq = p.frequency as SubFrequency;
          const displayName = SUB_PLAN_NAME[freq] ?? p.name.replace(/^(소형|중형|대형)\s*[·-]\s*/, "");
          const tier = SUB_PLAN_TIER[freq];
          return (
            <div
              key={p.id}
              className={`sub-plan-card${p.id === selectedPlan?.id ? " selected" : ""}`}
              onClick={() => setSelectedPlanId(p.id)}
            >
              <div className="sub-plan-name-row">
                <div className="sub-plan-name">{displayName}</div>
                {tier && <div className="sub-plan-tier">{tier}</div>}
              </div>
              {freq === "weekly" && <div className="sub-plan-tier-caption">★ 가장 많이 이용하는 서비스</div>}
              <div className="sub-plan-price">{p.price > 0 ? `${p.price.toLocaleString()}원 / 월` : "가격 안내 예정"}</div>
            </div>
          );
        })}
      </div>

      {selectedPlan && selectedPlan.frequency === "weekly" && selectedPlan.visits_per_month && (
        <div className="sub-plan-detail">
          <div>
            월 <strong>{selectedPlan.visits_per_month}회</strong> 방문 · 회당 약{" "}
            <strong>{Math.round(selectedPlan.price / selectedPlan.visits_per_month).toLocaleString()}원</strong>꼴로 이용하실 수 있어요.
          </div>
          <div>매주 1회, 정기적으로 방문해 항상 깨끗한 상태를 유지해드립니다.</div>
        </div>
      )}

      {priceFor && (
        <>
          <div className="mg-label" style={{ marginTop: 20 }}>
            세차 종류
          </div>
          <div className="rv-wash-list">
            {WASH_OPTIONS.map((o) => (
              <div key={o.type} className={`rv-wash-card${washType === o.type ? " selected" : ""}`} onClick={() => setWashType(o.type)}>
                <div className="rv-wash-name">{o.name}</div>
                <div className="rv-wash-price">{priceFor[o.type].toLocaleString()}원 / 월</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="sub-addon-cta" style={{ display: "none" }}>
        {/* TODO(Phase 6 follow-up): 구독자 전용 내부세차 1회 추가 신청 — 구독 사용량/차량 연동 이후 */}
      </div>

      {priceFor && selectedPlan && washType && (
        <div className="sub-total-box">
          <div className="sub-total-label">월 결제 예정 금액</div>
          <div className="sub-total-amount">{priceFor[washType].toLocaleString()}원</div>
          <div className="sub-total-sub">
            월 {selectedPlan.visits_per_month}회 방문 · 회당 약{" "}
            {(selectedPlan.visits_per_month ? Math.round(priceFor[washType] / selectedPlan.visits_per_month) : 0).toLocaleString()}원
          </div>
        </div>
      )}

      <div className="sub-addcar-notice">
        주 3회케어 및 차량 추가 시
        <br />
        고객센터로 별도 문의 바랍니다.
      </div>

      {!isActiveOrPastDue && (
        <button className="vw-cta-btn" onClick={handleApply}>
          구독 신청하기
        </button>
      )}

      <ConfirmModal
        open={cancelOpen}
        title="구독을 취소할까요?"
        sub="다음 결제일부터 자동결제가 청구되지 않습니다"
        confirmLabel="구독 취소"
        pending={pending}
        onConfirm={handleCancel}
        onClose={() => setCancelOpen(false)}
      />
    </>
  );
}
