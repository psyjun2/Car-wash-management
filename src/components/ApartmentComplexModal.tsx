"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export function ApartmentComplexModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const showToast = useToast();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("단지명을 입력해주세요");
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetch("/api/apartment-complexes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setPending(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "저장에 실패했습니다");
      return;
    }
    setName("");
    showToast("✅ 아파트 단지가 등록되었습니다");
    router.refresh();
    onClose();
  }

  return (
    <div className={`reservation-modal${open ? " on" : ""}`}>
      <div className="resv-modal-bg" onClick={onClose} />
      <div className="resv-modal-panel">
        <div className="resv-modal-handle" />
        <div className="resv-modal-header">
          <div className="resv-modal-title">아파트 단지 등록</div>
          <div className="resv-modal-close" onClick={onClose}>
            ✕
          </div>
        </div>
        <div className="resv-modal-body">
          <div className="mg-field" style={{ marginBottom: 8 }}>
            <label className="mg-label">단지명</label>
            <input
              className="mg-input"
              type="text"
              placeholder="예: 래미안 강서 자이"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}
        </div>
        <div className="resv-modal-footer">
          <button className="resv-cancel-btn" onClick={onClose}>
            취소
          </button>
          <button className="resv-save-btn" onClick={handleSave} disabled={pending}>
            {pending ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
