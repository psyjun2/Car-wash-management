import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBarBack } from "@/components/TopBarBack";
import { getSessionInfo } from "@/lib/auth/session";
import { listReservations } from "@/lib/data/reservations";
import { listAllSubscriptions, listActivePlans } from "@/lib/data/subscriptions";
import { listVehicles } from "@/lib/data/vehicles";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const RECENT_DAYS = 7;

function isRecent(createdAt: string, days: number) {
  return Date.now() - new Date(createdAt).getTime() < days * 24 * 60 * 60 * 1000;
}

export default async function AdminNotificationsPage() {
  const { user, isAdmin } = await getSessionInfo();
  if (!user || !isAdmin) redirect("/booking");

  const [reservations, subscriptions, plans, vehicles] = await Promise.all([
    listReservations({ userId: user.id, isAdmin: true }),
    listAllSubscriptions(),
    listActivePlans(),
    listVehicles({ userId: user.id, isAdmin: true }),
  ]);

  // Every 1-time booking auto-creates a vehicle row (see syncVehicleAndScheduleWash) —
  // that's not a customer registering a new car on purpose, so it shouldn't
  // double up as its own "new vehicle" alert.
  const pendingReservations = reservations
    .filter((r) => r.status === "pending")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const awaitingPaymentReservations = reservations
    .filter((r) => r.status === "awaiting_payment")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const recentSubscriptions = subscriptions
    .filter((s) => isRecent(s.created_at, RECENT_DAYS))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const recentVehicles = vehicles
    .filter((v) => isRecent(v.created_at, RECENT_DAYS) && !v.payment_plan?.startsWith("1회"))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const isEmpty =
    !pendingReservations.length && !awaitingPaymentReservations.length && !recentSubscriptions.length && !recentVehicles.length;

  return (
    <div className="page on" id="pg-notifications">
      <div className="safe-t" />
      <TopBarBack title="알림" backHref="/" />
      <div className="scroll">
        <div className="resv-body">
          <div id="notif-list">
            {isEmpty && <div className="resv-empty">🔔 새로운 알림이 없습니다</div>}

            {pendingReservations.length > 0 && (
              <>
                <div className="notif-section-title">🚗 1회 세차 신청</div>
                {pendingReservations.map((r) => {
                  const [y, m, d] = r.date.split("-").map(Number);
                  const dow = DOW[new Date(y, m - 1, d).getDay()];
                  return (
                    <Link href={`/booking/${r.id}`} className="resv-item admin" key={r.id}>
                      <div className="resv-item-body">
                        <div className="resv-item-top">
                          <span className="resv-time">
                            {m}/{d}({dow}){r.time ? ` ${r.time}` : ""}
                          </span>
                          <span className="resv-name">{r.name}</span>
                          {r.car_num && (
                            <span className="resv-car">
                              {r.car_num}
                              {r.car_model ? ` · ${r.car_model}` : ""}
                            </span>
                          )}
                        </div>
                        <div className="resv-status-badge pending">🔔 새 예약 요청</div>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}

            {awaitingPaymentReservations.length > 0 && (
              <>
                <div className="notif-section-title">💰 결제 확인 대기</div>
                {awaitingPaymentReservations.map((r) => {
                  const [y, m, d] = r.date.split("-").map(Number);
                  const dow = DOW[new Date(y, m - 1, d).getDay()];
                  return (
                    <Link href={`/booking/${r.id}`} className="resv-item admin" key={r.id}>
                      <div className="resv-item-body">
                        <div className="resv-item-top">
                          <span className="resv-time">
                            {m}/{d}({dow}){r.time ? ` ${r.time}` : ""}
                          </span>
                          <span className="resv-name">{r.name}</span>
                          {r.car_num && (
                            <span className="resv-car">
                              {r.car_num}
                              {r.car_model ? ` · ${r.car_model}` : ""}
                            </span>
                          )}
                        </div>
                        <div className="resv-status-badge awaiting_payment">💰 승인됨 · 결제 확인 필요</div>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}

            {recentSubscriptions.length > 0 && (
              <>
                <div className="notif-section-title">🔄 구독결제 신청</div>
                {recentSubscriptions.map((s) => {
                  const plan = plans.find((p) => p.id === s.plan_id);
                  return (
                    <Link href="/subscribe" className="resv-item admin" key={s.id}>
                      <div className="resv-item-body">
                        <div className="resv-item-top">
                          <span className="resv-name">{plan ? plan.name : "구독 플랜"}</span>
                        </div>
                        <div className="resv-loc">고객 ID: {s.user_id.slice(0, 8)}</div>
                        <div className="resv-status-badge pending">🔔 새 구독 신청</div>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}

            {recentVehicles.length > 0 && (
              <>
                <div className="notif-section-title">🚙 고객 차량 등록</div>
                {recentVehicles.map((v) => (
                  <Link href={`/vehicles/${v.id}`} className="resv-item admin" key={v.id}>
                    <div className="resv-item-body">
                      <div className="resv-item-top">
                        <span className="resv-name">{v.car_num || "차량번호 미입력"}</span>
                        {v.car_model && <span className="resv-car">{v.car_model}</span>}
                      </div>
                      <div className="resv-status-badge pending">🔔 새 차량 등록</div>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
