"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Vehicle } from "@/lib/data/vehicles";
import { toDateKey, todayKey } from "@/lib/dateKey";
import { DeleteVehicleModal } from "@/components/DeleteVehicleModal";
import { VehicleCard } from "@/components/VehicleCard";

function vehDateKey(v: Vehicle): string {
  const d = new Date(v.created_at);
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

export function VehiclesView({ vehicles, isAdmin }: { vehicles: Vehicle[]; isAdmin: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const q = isAdmin ? search.trim().toLowerCase() : "";
  const list = useMemo(() => {
    let l = vehicles;
    if (q) l = l.filter((v) => (v.car_num || "").toLowerCase().includes(q));
    return l;
  }, [vehicles, q]);

  const countByDate = useMemo(() => {
    const map: Record<string, number> = {};
    vehicles.forEach((v) => {
      const k = vehDateKey(v);
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [vehicles]);

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

  return (
    <>
      <div className="resv-list-header" id="veh-static-list-header" style={{ display: isAdmin ? "none" : undefined }}>
        <div className="resv-list-title">등록한 차량</div>
        <button className="resv-add-btn" onClick={() => router.push("/vehicles/new")}>
          + 차량 등록
        </button>
      </div>

      {isAdmin && (
        <input
          className="mg-input veh-search"
          type="text"
          placeholder="차량번호로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {isAdmin && (
        <div className="resv-cal-card veh-cal-only" id="veh-cal-card">
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
              const d = i + 1;
              const dateKey = toDateKey(viewYear, viewMonth, d);
              const count = countByDate[dateKey] || 0;
              return (
                <div
                  className={`resv-day${dateKey === tKey ? " today" : ""}`}
                  key={dateKey}
                  onClick={() => router.push(`/admin/vehicles/${dateKey}`)}
                >
                  <div className="rd-num">{d}</div>
                  {count > 0 && <div className="rd-dot">{count > 9 ? "9+" : count}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div id="veh-list">
        {isAdmin && !q
          ? null
          : list.length === 0
            ? <div className="resv-empty">🚗 {isAdmin ? "검색된 차량이 없습니다" : "등록된 차량이 없습니다"}</div>
            : list.map((v) => <VehicleCard key={v.id} vehicle={v} isAdmin={isAdmin} onAskDelete={setDeleteTarget} />)}
      </div>

      <DeleteVehicleModal
        vehicle={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          setDeleteTarget(null);
          router.refresh();
        }}
      />
    </>
  );
}
