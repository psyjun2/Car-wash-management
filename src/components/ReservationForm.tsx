"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Reservation, ReservationInput } from "@/lib/data/reservations";
import type { Vehicle } from "@/lib/data/vehicles";
import { WASH_PRICES, type CarSize, type WashType } from "@/lib/pricing";
import { useToast } from "@/components/Toast";
import { ReservationCalendarPicker } from "@/components/ReservationCalendarPicker";

const CAR_SIZES: CarSize[] = ["소형", "중형", "대형"];
const WASH_OPTIONS: { type: WashType; name: string }[] = [
  { type: "exterior", name: "외부세차만" },
  { type: "interior", name: "내부세차만" },
  { type: "both", name: "외부+내부세차" },
];

type Props = {
  reservation: Reservation | null;
  reservations: Reservation[];
  vehicles: Vehicle[];
  defaultDate?: string;
  defaultTime?: string;
  defaultName?: string;
  backHref: string;
};

function initialVehicleId(reservation: Reservation | null, vehicles: Vehicle[]): string {
  if (reservation) {
    return vehicles.find((v) => v.car_num === reservation.car_num)?.id ?? "";
  }
  return vehicles.length === 1 ? vehicles[0].id : "";
}

export function ReservationForm({ reservation, reservations, vehicles, defaultDate, defaultTime, defaultName, backHref }: Props) {
  const router = useRouter();
  const showToast = useToast();

  const [date, setDate] = useState(reservation?.date ?? defaultDate ?? "");
  const [time, setTime] = useState(reservation?.time ?? defaultTime ?? "");
  const [name, setName] = useState(reservation?.name ?? defaultName ?? "");
  const [phone, setPhone] = useState(reservation?.phone ?? "");
  const [selectedVehicleId, setSelectedVehicleId] = useState(() => initialVehicleId(reservation, vehicles));
  const [loc, setLoc] = useState(reservation?.loc ?? "");
  const [note, setNote] = useState(reservation?.note ?? "");
  const [carSize, setCarSize] = useState<CarSize>(reservation?.car_size ?? "소형");
  const [washType, setWashType] = useState<WashType>(reservation?.wash_type ?? "exterior");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const carNum = selectedVehicle?.car_num ?? "";
  const carModel = selectedVehicle?.car_model ?? "";

  const [y, m, d] = date ? date.split("-").map(Number) : [0, 0, 0];
  const dow = date ? ["일", "월", "화", "수", "목", "금", "토"][new Date(y, m - 1, d).getDay()] : "";
  const dateLabel = date ? `${m}월 ${d}일(${dow})${time ? ` ${time}` : ""}` : "—";
  const price = WASH_PRICES[carSize][washType];

  if (pickingDate) {
    return (
      <>
        <div className="topbar">
          <div className="tb-back" onClick={() => setPickingDate(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </div>
          <div className="tb-center">날짜 변경</div>
          <div className="tb-spacer" />
        </div>
        <div className="scroll">
          <ReservationCalendarPicker
            reservations={reservations}
            blockToday
            onSelectSlot={(newDate, newTime) => {
              setDate(newDate);
              setTime(newTime);
              setPickingDate(false);
            }}
          />
        </div>
      </>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !selectedVehicleId || !loc.trim()) {
      setError("고객명, 연락처, 차량, 주차 위치는 필수입니다");
      return;
    }

    const payload: ReservationInput = {
      date,
      time: time || null,
      name: name.trim(),
      phone: phone.trim(),
      car_num: carNum.trim(),
      car_model: carModel.trim(),
      loc: loc.trim(),
      note: note.trim(),
      wash_type: washType,
      car_size: carSize,
      is_addon: false,
    };

    setPending(true);
    setError(null);
    const res = await fetch(reservation ? `/api/reservations/${reservation.id}` : "/api/reservations", {
      method: reservation ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setPending(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "저장에 실패했습니다");
      return;
    }
    showToast(reservation ? "✏️ 예약이 수정되었습니다" : "✅ 예약이 등록되었습니다");
    router.push(reservation ? `/booking/${reservation.id}` : "/booking");
    router.refresh();
  }

  return (
    <>
      <div className="topbar">
        <Link href={backHref} className="tb-back" aria-label="뒤로">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div className="tb-center">{reservation ? "예약 수정" : "예약 추가"}</div>
        <div className="tb-spacer" />
      </div>
      <div className="scroll">
        <form className="resv-body" style={{ paddingBottom: 100 }} onSubmit={handleSubmit}>
          <div className="mg-field">
            <label className="mg-label">예약 일시</label>
            <div className="mg-input rv-datetime-readonly editable" onClick={() => setPickingDate(true)}>
              {dateLabel}
            </div>
          </div>
          <div className="mg-field">
            <label className="mg-label">
              고객명 <span className="mg-req">*</span>
            </label>
            <input className="mg-input" type="text" placeholder="예: 홍길동" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="mg-field">
            <label className="mg-label">
              연락처 <span className="mg-req">*</span>
            </label>
            <input className="mg-input" type="tel" placeholder="예: 010-1234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="mg-field">
            <label className="mg-label">
              차량 선택 <span className="mg-req">*</span>
            </label>
            <select className="mg-input" value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}>
              <option value="">선택하세요</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.car_num}
                  {v.car_model ? ` · ${v.car_model}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="mg-field">
            <label className="mg-label">
              주차 위치 (정확하게 작성) <span className="mg-req">*</span>
            </label>
            <input
              className="mg-input"
              type="text"
              placeholder="예: 강남 래미안 101동 지하주차장"
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
            />
          </div>
          <div className="mg-field">
            <label className="mg-label">차량 크기</label>
            <div className="sub-size-tabs">
              {CAR_SIZES.map((sz) => (
                <div
                  key={sz}
                  className={`sub-size-tab${sz === carSize ? " selected" : ""}`}
                  onClick={() => setCarSize(sz)}
                >
                  {sz}
                </div>
              ))}
            </div>
          </div>
          <div className="mg-field">
            <label className="mg-label">세차 종류</label>
            <div className="rv-wash-list">
              {WASH_OPTIONS.map((o) => {
                const prices = WASH_PRICES[carSize];
                let priceLabel: React.ReactNode;
                if (o.type === "both") {
                  const sum = prices.exterior + prices.interior;
                  priceLabel =
                    sum > prices.both ? (
                      <>
                        <span className="rv-wash-price-strike">{sum.toLocaleString()}원</span>
                        {prices.both.toLocaleString()}원
                      </>
                    ) : (
                      `${prices.both.toLocaleString()}원`
                    );
                } else {
                  priceLabel = `${prices[o.type].toLocaleString()}원`;
                }
                return (
                  <div
                    key={o.type}
                    className={`rv-wash-card${washType === o.type ? " selected" : ""}`}
                    onClick={() => setWashType(o.type)}
                  >
                    <div className="rv-wash-name">{o.name}</div>
                    <div className="rv-wash-price">{priceLabel}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mg-field" style={{ marginBottom: 8 }}>
            <label className="mg-label">요청사항</label>
            <input
              className="mg-input"
              type="text"
              placeholder="요청사항이 있으면 입력해주세요"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="mg-field" style={{ marginBottom: 0 }}>
            <label className="mg-label">결제 금액</label>
            <div className="rv-price-box">{price.toLocaleString()}원</div>
          </div>
          {error && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 12 }}>{error}</div>}
        </form>
      </div>
      <div className="vw-bottom-cta">
        <button className="vw-cta-btn" onClick={handleSubmit} disabled={pending}>
          {pending ? "저장 중..." : reservation ? "저장" : "결제하기"}
        </button>
      </div>
    </>
  );
}
