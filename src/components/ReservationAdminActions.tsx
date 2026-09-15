"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import type { Reservation } from "@/lib/data/reservations";

export function ReservationAdminActions({
  reservationId,
  status,
}: {
  reservationId: string;
  status: Reservation["status"];
}) {
  const router = useRouter();
  const showToast = useToast();
  const [pending, setPending] = useState(false);

  const LABELS = {
    awaiting_payment: { toast: "✅ 예약을 승인했습니다 (결제 대기)", failToast: "승인 실패: " },
    accepted: { toast: "💰 결제를 확인했습니다", failToast: "결제 확인 실패: " },
    rejected: { toast: "❌ 예약을 거절했습니다", failToast: "거절 실패: " },
  } as const;

  async function setStatus(next: "awaiting_payment" | "accepted" | "rejected") {
    setPending(true);
    const res = await fetch(`/api/reservations/${reservationId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json();
      showToast(LABELS[next].failToast + (data.error ?? "알 수 없는 오류"));
      return;
    }
    showToast(LABELS[next].toast);
    router.refresh();
  }

  if (status === "accepted" || status === "rejected") return null;

  return (
    <div className="resv-detail-actions">
      {status === "pending" && (
        <button className="resv-accept-btn active" disabled={pending} onClick={() => setStatus("awaiting_payment")}>
          예약 승인
        </button>
      )}
      {status === "awaiting_payment" && (
        <button className="resv-accept-btn active" disabled={pending} onClick={() => setStatus("accepted")}>
          결제 확인
        </button>
      )}
      <button className="resv-reject-btn active" disabled={pending} onClick={() => setStatus("rejected")}>
        예약 거절
      </button>
    </div>
  );
}
