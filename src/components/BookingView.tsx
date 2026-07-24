"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Reservation } from "@/lib/data/reservations";
import { toDateKey, todayKey } from "@/lib/dateKey";
import { BOOKING_SLOTS } from "@/lib/pricing";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export function BookingView({ reservations, isAdmin, userId }: { reservations: Reservation[]; isAdmin: boolean; userId: string }) {
  const router = useRouter();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
  const countByDate: Record<string, number> = {};
  reservations.forEach((r) => {
    countByDate[r.date] = (countByDate[r.date] || 0) + 1;
  });

  const myReservations = reservations
    .filter((r) => r.user_id === userId)
    .sort((a, b) => (a.date === b.date ? (a.time ?? "").localeCompare(b.time ?? "") : a.date.localeCompare(b.date)));

  const takenTimes = selectedDate
    ? new Set(reservations.filter((r) => r.date === selectedDate && r.status !== "rejected").map((r) => r.time))
    : new Set<string | null>();
  const selectedDow = selectedDate ? new Date(...(selectedDate.split("-").map(Number) as [number, number, number])).getDay() : null;

  return (
    <div id="resv-main">
      <div className="resv-area-box">
        <div className="resv-area-title">📍 현재 방문가능지역</div>
        <div className="resv-area-text">
          서울지역 → 강서구
          <br />
          김포지역 → 고촌,풍무,사우동
          <br />
          <br />
          (원하시는 지역이 있다면 고객센터로 문의바랍니다.)
        </div>
      </div>

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
          {DOW.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="resv-cal-grid">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div className="resv-day empty" key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = toDateKey(viewYear, viewMonth, day);
            const count = countByDate[dateKey] || 0;
            const isToday = dateKey === tKey;
            const isSelected = dateKey === selectedDate;
            const dow = new Date(viewYear, viewMonth, day).getDay();
            const isClosed = !isAdmin && (dow === 5 || dow === 6);

            if (isClosed) {
              return (
                <div className={`resv-day disabled${isToday ? " today" : ""}`} key={dateKey}>
                  <div className="rd-num">{day}</div>
                </div>
              );
            }
            return (
              <div
                className={`resv-day${isToday ? " today" : ""}${isSelected ? " selected" : ""}`}
                key={dateKey}
                onClick={() => (isAdmin ? router.push(`/admin/reservations/${dateKey}`) : setSelectedDate(dateKey))}
              >
                <div className="rd-num">{day}</div>
                {isAdmin && count > 0 && <div className="rd-dot">{count > 9 ? "9+" : count}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {!isAdmin && selectedDate && (
        <div className="resv-slot-panel" id="resv-slot-panel">
          {selectedDow === 5 || selectedDow === 6 ? (
            <>
              <div className="resv-list-title">예약 가능 시간</div>
              <div className="resv-slot-grid">
                <div className="resv-slot-btn closed-day">금요일과 토요일은 예약이 불가합니다</div>
              </div>
            </>
          ) : (
            <>
              <div className="resv-list-title">
                {(() => {
                  const [, m, d] = selectedDate.split("-").map(Number);
                  return `${m}/${d}(${DOW[selectedDow!]}) 예약 가능 시간`;
                })()}
              </div>
              <div className="resv-slot-grid">
                {BOOKING_SLOTS.map((t) => {
                  const taken = takenTimes.has(t);
                  return (
                    <button
                      key={t}
                      className={`resv-slot-btn${taken ? " taken" : ""}`}
                      disabled={taken}
                      onClick={() => router.push(`/booking/new?date=${selectedDate}&time=${t}`)}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {!isAdmin && (
        <div className="resv-list-section" id="resv-list-section">
          <div className="resv-list-header">
            <div className="resv-list-title">내가 신청한 예약</div>
          </div>
          <div id="resv-list">
            {myReservations.length === 0 ? (
              <div className="resv-empty">📅 신청한 예약이 없습니다</div>
            ) : (
              myReservations.map((r) => {
                const [ry, rm, rd] = r.date.split("-").map(Number);
                const dow = DOW[new Date(ry, rm - 1, rd).getDay()];
                return (
                  <Link href={`/booking/${r.id}`} className="resv-item" key={r.id} style={{ cursor: "pointer" }}>
                    <div className="resv-item-body resv-item-lines">
                      <div className="resv-time">
                        {rm}/{rd}({dow})
                        {r.time ? ` ${r.time}` : ""}
                      </div>
                      <div className="resv-name">{r.name}</div>
                      {r.car_num && <div className="resv-car">{r.car_num}</div>}
                      {r.car_model && <div className="resv-car">{r.car_model}</div>}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
