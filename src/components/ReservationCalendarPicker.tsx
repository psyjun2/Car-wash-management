"use client";

import { useState } from "react";
import type { Reservation } from "@/lib/data/reservations";
import { toDateKey, todayKey } from "@/lib/dateKey";
import { BOOKING_SLOTS } from "@/lib/pricing";
import { useToast } from "@/components/Toast";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

type Props = {
  reservations: Reservation[];
  blockToday?: boolean;
  onSelectSlot: (date: string, time: string) => void;
};

// The "pick a date/time" calendar+slot panel — shared by the initial
// booking flow (BookingView) and the "change date" re-pick step inside
// ReservationForm (where same-day changes are blocked).
export function ReservationCalendarPicker({ reservations, blockToday, onSelectSlot }: Props) {
  const showToast = useToast();
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

  function handleSelectDate(dateKey: string) {
    if (blockToday && dateKey === todayKey()) {
      showToast("당일 변경은 불가합니다");
      return;
    }
    setSelectedDate(dateKey);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const tKey = todayKey();
  const takenTimes = selectedDate
    ? new Set(reservations.filter((r) => r.date === selectedDate && r.status !== "rejected").map((r) => r.time))
    : new Set<string | null>();
  const selectedDow = selectedDate ? new Date(...(selectedDate.split("-").map(Number) as [number, number, number])).getDay() : null;

  return (
    <div className="resv-body">
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
            const dow = new Date(viewYear, viewMonth, day).getDay();
            const isClosed = dow === 5 || dow === 6;
            if (isClosed) {
              return (
                <div className={`resv-day disabled${dateKey === tKey ? " today" : ""}`} key={dateKey}>
                  <div className="rd-num">{day}</div>
                </div>
              );
            }
            return (
              <div
                className={`resv-day${dateKey === tKey ? " today" : ""}${dateKey === selectedDate ? " selected" : ""}`}
                key={dateKey}
                onClick={() => handleSelectDate(dateKey)}
              >
                <div className="rd-num">{day}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="resv-slot-panel">
        {!selectedDate ? (
          <div className="resv-list-title">날짜를 선택해주세요</div>
        ) : selectedDow === 5 || selectedDow === 6 ? (
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
                    onClick={() => onSelectSlot(selectedDate, t)}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
