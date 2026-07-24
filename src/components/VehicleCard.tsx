"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Vehicle } from "@/lib/data/vehicles";

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

type Props = {
  vehicle: Vehicle;
  isAdmin: boolean;
  onAskDelete?: (v: Vehicle) => void;
};

// Not an <a> at the top level — the action buttons inside (edit link,
// delete button) are real interactive elements, and nesting <a> inside
// <a> is invalid HTML / breaks React's Server Component serialization
// when this pattern is used from a Server Component.
export function VehicleCard({ vehicle: v, isAdmin, onAskDelete }: Props) {
  const router = useRouter();

  return (
    <div
      className="veh-card veh-card-clickable"
      onClick={() => router.push(`/vehicles/${v.id}`)}
    >
      <div className="veh-card-top">
        <div className="veh-card-info">
          <div className="veh-card-num">{v.car_num || "차량번호 미입력"}</div>
          {v.car_model && <div className="veh-card-model">{v.car_model}</div>}
        </div>
        <div className="veh-card-actions" onClick={(e) => e.stopPropagation()}>
          <Link href={`/vehicles/${v.id}/edit`} className="resv-edit-btn">
            <EditIcon />
          </Link>
          {isAdmin || !onAskDelete ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          ) : (
            <button className="resv-del-btn" onClick={() => onAskDelete(v)}>
              <TrashIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
