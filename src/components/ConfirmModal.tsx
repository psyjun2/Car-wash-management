"use client";

type Props = {
  open: boolean;
  title: string;
  sub?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

// Generic version of the .delete-modal pattern used for vehicle deletion —
// same markup/classes, just without the vehicle-specific .dm-info block, so
// it works for any "are you sure?" confirmation (cancel reservation, delete
// a wash record, etc.) instead of the browser's native confirm().
export function ConfirmModal({
  open,
  title,
  sub,
  confirmLabel = "확인",
  cancelLabel = "취소",
  pending = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <div className={`delete-modal${open ? " on" : ""}`}>
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
        <div className="dm-title">{title}</div>
        {sub && <div className="dm-sub">{sub}</div>}
        <div className="dm-btns">
          <button className="dm-cancel-btn" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </button>
          <button className="dm-confirm-btn" onClick={onConfirm} disabled={pending}>
            {pending ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
