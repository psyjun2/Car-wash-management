import { notFound, redirect } from "next/navigation";
import { TopBarBack } from "@/components/TopBarBack";
import { ReservationDetailActions } from "@/components/ReservationDetailActions";
import { ReservationAdminActions } from "@/components/ReservationAdminActions";
import { ReservationPaymentButton } from "@/components/ReservationPaymentButton";
import { getSessionInfo } from "@/lib/auth/session";
import { getReservation } from "@/lib/data/reservations";

type Params = { params: Promise<{ id: string }> };

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

const STATUS_LABEL: Record<string, string> = {
  pending: "🔔 승인 대기",
  awaiting_payment: "💰 결제 대기",
  accepted: "✅ 예약 확정",
  rejected: "❌ 예약 거절",
};

export default async function ReservationDetailPage({ params }: Params) {
  const { id } = await params;
  const { user, isAdmin } = await getSessionInfo();
  if (!user) redirect("/booking");

  const r = await getReservation(id);
  if (!r) notFound();
  if (!isAdmin && r.user_id !== user.id) redirect("/booking");

  const [y, m, d] = r.date.split("-").map(Number);
  const dow = DOW[new Date(y, m - 1, d).getDay()];

  return (
    <div className="page on" id="pg-resv-detail">
      <div className="safe-t" />
      <TopBarBack title="예약 상세" backHref="/booking" />
      <div className="scroll">
        <div className="resv-body">
          <div id="resv-detail-panel">
            <div className="veh-record-card">
              <div className="veh-card-num">
                {r.name}
                {r.is_addon && <span className="resv-status-badge accepted"> 구독 추가</span>}
              </div>
              <div className="veh-card-model">
                {m}/{d}({dow})
                {r.time ? ` · ${r.time}` : ""}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {r.car_num && (
                  <div className="veh-card-note">
                    🚗 {r.car_num}
                    {r.car_model ? ` · ${r.car_model}` : ""}
                  </div>
                )}
                {r.phone && <div className="veh-card-note">📞 {r.phone}</div>}
                {r.loc && <div className="veh-card-note">📍 {r.loc}</div>}
                {r.note && <div className="veh-card-note">📝 {r.note}</div>}
              </div>
              <div className={`resv-status-badge ${r.status}`} style={{ marginTop: 14 }}>
                {STATUS_LABEL[r.status]}
              </div>
              {isAdmin ? (
                <ReservationAdminActions reservationId={r.id} status={r.status} />
              ) : (
                <>
                  {r.status === "awaiting_payment" && <ReservationPaymentButton />}
                  <ReservationDetailActions reservationId={r.id} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
