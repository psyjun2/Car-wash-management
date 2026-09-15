"use client";

import { useToast } from "@/components/Toast";

// TODO(Toss): once NEXT_PUBLIC_TOSS_CLIENT_KEY / TOSS_SECRET_KEY exist, wire
// the real PaymentWidget flow here; on success call POST
// /api/reservations/[id]/status with { status: "accepted" } (admin route
// today — will need a customer-payment-confirmed path once this is real).
const TOSS_READY = !!process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

export function ReservationPaymentButton() {
  const showToast = useToast();

  function handlePay() {
    if (!TOSS_READY) {
      showToast("결제 연동이 아직 설정되지 않았습니다. 관리자에게 문의해주세요");
      return;
    }
  }

  return (
    <div className="resv-detail-actions">
      <button className="resv-accept-btn active" onClick={handlePay}>
        결제하기
      </button>
    </div>
  );
}
