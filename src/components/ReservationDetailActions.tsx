"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";

export function ReservationDetailActions({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleCancel() {
    setPending(true);
    const res = await fetch(`/api/reservations/${reservationId}`, { method: "DELETE" });
    setPending(false);
    if (!res.ok) {
      const data = await res.json();
      showToast("취소 실패: " + (data.error ?? "알 수 없는 오류"));
      return;
    }
    setConfirmOpen(false);
    showToast("🗑️ 예약이 취소되었습니다");
    router.push("/booking");
    router.refresh();
  }

  return (
    <>
      <div className="resv-detail-actions">
        <button className="resv-accept-btn" onClick={() => router.push(`/booking/${reservationId}/edit`)}>
          예약 수정하기
        </button>
        <button className="resv-reject-btn active" onClick={() => setConfirmOpen(true)}>
          결제 취소하기
        </button>
      </div>
      <ConfirmModal
        open={confirmOpen}
        title="예약을 취소할까요?"
        sub="취소 후에는 되돌릴 수 없습니다"
        confirmLabel="예약 취소"
        pending={pending}
        onConfirm={handleCancel}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
