"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { WashRecord } from "@/lib/data/wash-records";
import type { Reservation } from "@/lib/data/reservations";
import type { Subscription, SubscriptionPlan } from "@/lib/data/subscriptions";
import { toDateKey, todayKey } from "@/lib/dateKey";
import { WASH_TYPE_LABELS, SUB_PLAN_TIER, type SubFrequency } from "@/lib/pricing";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";

const WASH_STATUS_LABELS: Record<string, string> = { scheduled: "예정", washing: "세차중", done: "세차완료" };

/** "1회 세차 · 외부+내부세차 · 중형" for a one-time booking, "월 베이직 결제" for a subscription visit — not just the generic service_type. */
function describeService({
  record,
  washDate,
  reservations,
  subscriptionInfo,
}: {
  record: WashRecord | undefined;
  washDate: string;
  reservations: Reservation[];
  subscriptionInfo: { subscription: Subscription; plan: SubscriptionPlan | null } | null;
}): string {
  if (!record) return "";
  if (record.service_type === "onetime") {
    const reservation = reservations.find((r) => r.date === washDate);
    if (reservation) {
      return `1회 세차 · ${WASH_TYPE_LABELS[reservation.wash_type]} · ${reservation.car_size}`;
    }
    return "1회 세차";
  }
  if (subscriptionInfo?.plan) {
    const tier = SUB_PLAN_TIER[subscriptionInfo.plan.frequency as SubFrequency];
    return tier ? `월 ${tier} 결제` : subscriptionInfo.plan.name;
  }
  return "구독 서비스";
}

type Props = {
  vehicleId: string;
  isAdmin: boolean;
  records: WashRecord[];
  reservations: Reservation[];
  subscriptionInfo: { subscription: Subscription; plan: SubscriptionPlan | null } | null;
};

export function VehicleDetailView({ vehicleId, isAdmin, records, reservations, subscriptionInfo }: Props) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey());

  function shiftMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const tKey = todayKey();
  const recordMap: Record<string, WashRecord> = {};
  records.forEach((r) => {
    recordMap[r.wash_date] = r;
  });

  const [m, d] = selectedDate.split("-").slice(1).map(Number);
  const dateLabel = `${m}/${d}`;
  const record = recordMap[selectedDate];

  return (
    <>
      <div className="resv-cal-card">
        <div className="resv-cal-header">
          <div className="resv-cal-nav" onClick={() => shiftMonth(-1)}>
            ‹
          </div>
          <div className="resv-cal-title">
            {viewYear}년 {viewMonth + 1}월
          </div>
          <div className="resv-cal-nav" onClick={() => shiftMonth(1)}>
            ›
          </div>
        </div>
        <div className="resv-cal-weekdays">
          <span>일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span>토</span>
        </div>
        <div className="resv-cal-grid">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div className="resv-day empty" key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = toDateKey(viewYear, viewMonth, day);
            const rec = recordMap[dateKey];
            return (
              <div
                className={`resv-day${dateKey === tKey ? " today" : ""}${dateKey === selectedDate ? " selected" : ""}`}
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
              >
                <div className="rd-num">{day}</div>
                {rec && <div className={`rd-dot ${rec.service_type}`}>{rec.service_type === "subscription" ? "구" : "1"}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div id="vdetail-record-panel">
        {isAdmin ? (
          <AdminRecordPanel
            key={selectedDate}
            vehicleId={vehicleId}
            washDate={selectedDate}
            dateLabel={dateLabel}
            record={record}
          />
        ) : record ? (
          <div className="resv-list-section">
            <div className="resv-list-header">
              <div className="resv-list-title">{dateLabel}</div>
              <span className={`veh-wash-badge ${record.status}`}>{WASH_STATUS_LABELS[record.status]}</span>
            </div>
            <div className="veh-record-card">
              <div className="veh-service-type-label">
                {describeService({ record, washDate: selectedDate, reservations, subscriptionInfo })}
              </div>
              <div className="veh-card-note">{record.note || "등록된 특이사항이 없습니다"}</div>
              {!!record.wash_record_photos?.length && (
                <div className="veh-photo-scroll" style={{ marginTop: 10 }}>
                  {record.wash_record_photos.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo_url} className="veh-photo-thumb" key={p.id} alt="세차 사진" />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="resv-empty">📅 {dateLabel}에는 예정된 세차가 없습니다</div>
        )}
      </div>
    </>
  );
}

function AdminRecordPanel({
  vehicleId,
  washDate,
  dateLabel,
  record,
}: {
  vehicleId: string;
  washDate: string;
  dateLabel: string;
  record: WashRecord | undefined;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [serviceType, setServiceType] = useState(record?.service_type ?? "onetime");
  const [status, setStatus] = useState(record?.status ?? "scheduled");
  const [note, setNote] = useState(record?.note ?? "");
  const [pending, setPending] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    setPending(true);
    const res = await fetch("/api/wash-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId, washDate, serviceType, status, note: note.trim() || null }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json();
      showToast("저장 실패: " + (data.error ?? "알 수 없는 오류"));
      return;
    }
    showToast(record ? "✏️ 기록이 수정되었습니다" : "✅ 저장되었습니다");
    router.refresh();
  }

  async function handleDelete() {
    if (!record) return;
    setPending(true);
    const res = await fetch(`/api/wash-records/${record.id}`, { method: "DELETE" });
    setPending(false);
    if (!res.ok) {
      const data = await res.json();
      showToast("삭제 실패: " + (data.error ?? "알 수 없는 오류"));
      return;
    }
    setDeleteConfirmOpen(false);
    showToast("🗑️ 기록이 삭제되었습니다");
    router.refresh();
  }

  async function handlePhotoInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setPending(true);
    for (const file of files) {
      const form = new FormData();
      form.set("vehicleId", vehicleId);
      form.set("washDate", washDate);
      form.set("file", file);
      const res = await fetch("/api/wash-records/photos", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        showToast("업로드 실패: " + (data.error ?? "알 수 없는 오류"));
      }
    }
    setPending(false);
    showToast("📷 사진이 등록되었습니다");
    router.refresh();
  }

  async function handlePhotoDelete(photoId: string, storagePath: string) {
    setPending(true);
    const res = await fetch(
      `/api/wash-records/photos/${photoId}?storagePath=${encodeURIComponent(storagePath)}`,
      { method: "DELETE" },
    );
    setPending(false);
    if (!res.ok) {
      const data = await res.json();
      showToast("삭제 실패: " + (data.error ?? "알 수 없는 오류"));
      return;
    }
    router.refresh();
  }

  return (
    <div className="resv-list-section">
      <div className="resv-list-header">
        <div className="resv-list-title">{dateLabel} 세차 기록</div>
      </div>
      <div className="veh-record-card">
        <label className="mg-label">서비스 종류</label>
        <select className="mg-input" value={serviceType} onChange={(e) => setServiceType(e.target.value as "onetime" | "subscription")}>
          <option value="onetime">1회 세차</option>
          <option value="subscription">구독 서비스</option>
        </select>
        <label className="mg-label" style={{ marginTop: 14 }}>
          진행 상태
        </label>
        <select className="mg-input" value={status} onChange={(e) => setStatus(e.target.value as "scheduled" | "washing" | "done")}>
          <option value="scheduled">예정</option>
          <option value="washing">세차중</option>
          <option value="done">세차완료</option>
        </select>
        <label className="mg-label" style={{ marginTop: 14 }}>
          특이사항
        </label>
        <textarea
          className="mg-input veh-record-note"
          placeholder="특이사항을 입력하세요"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <label className="mg-label" style={{ marginTop: 14 }}>
          사진
        </label>
        <div className="veh-photo-grid">
          {(record?.wash_record_photos ?? []).map((p) => (
            <div className="veh-photo-item" key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo_url} alt="세차 사진" />
              <div className="veh-photo-remove" onClick={() => handlePhotoDelete(p.id, p.storage_path)}>
                ✕
              </div>
            </div>
          ))}
          <label className="veh-photo-add">
            +
            <input type="file" accept="image/*" multiple style={{ display: "none" }} ref={fileInputRef} onChange={handlePhotoInput} />
          </label>
        </div>
        <div className="veh-record-actions">
          {record && (
            <button className="resv-cancel-btn" onClick={() => setDeleteConfirmOpen(true)} disabled={pending}>
              기록 삭제
            </button>
          )}
          <button className="resv-save-btn" onClick={handleSave} disabled={pending}>
            저장
          </button>
        </div>
      </div>
      <ConfirmModal
        open={deleteConfirmOpen}
        title="이 기록을 삭제할까요?"
        sub="등록된 사진도 함께 삭제되며 복구할 수 없습니다"
        confirmLabel="삭제"
        pending={pending}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
