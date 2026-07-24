"use client";

import { useState } from "react";
import type { Vehicle } from "@/lib/data/vehicles";
import { useToast } from "@/components/Toast";

type Props = {
  vehicle: Vehicle | null;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteVehicleModal({ vehicle, onClose, onDeleted }: Props) {
  const showToast = useToast();
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!vehicle) return;
    setPending(true);
    const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: "DELETE" });
    setPending(false);
    if (!res.ok) {
      const data = await res.json();
      showToast("삭제 실패: " + (data.error ?? "알 수 없는 오류"));
      return;
    }
    showToast("🗑️ 차량이 삭제되었습니다");
    onDeleted();
  }

  return (
    <div className={`delete-modal${vehicle ? " on" : ""}`}>
      <div className="dm-bg" onClick={onClose} />
      <div className="dm-card">
        <div className="dm-circle">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>
        <div className="dm-title">차량을 삭제할까요?</div>
        <div className="dm-sub">등록된 사진도 함께 삭제되며 복구할 수 없습니다</div>
        <div className="dm-info">
          <div className="dm-car-num">{vehicle?.car_num || "차량번호 없음"}</div>
          <div className="dm-car-name">{vehicle?.car_model || ""}</div>
        </div>
        <div className="dm-btns">
          <button className="dm-cancel-btn" onClick={onClose} disabled={pending}>
            취소
          </button>
          <button className="dm-confirm-btn" onClick={handleConfirm} disabled={pending}>
            {pending ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
