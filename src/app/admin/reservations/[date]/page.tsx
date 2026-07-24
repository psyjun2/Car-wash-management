import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBarBack } from "@/components/TopBarBack";
import { getSessionInfo } from "@/lib/auth/session";
import { listReservations } from "@/lib/data/reservations";

type Params = { params: Promise<{ date: string }> };

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export default async function AdminReservationDayPage({ params }: Params) {
  const { date } = await params;
  const { user, isAdmin } = await getSessionInfo();
  if (!user || !isAdmin) redirect("/booking");

  const [y, m, d] = date.split("-").map(Number);
  const dow = DOW[new Date(y, m - 1, d).getDay()];

  const reservations = await listReservations({ userId: user.id, isAdmin });
  const items = reservations
    .filter((r) => r.date === date)
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));

  return (
    <div className="page on" id="pg-resv-day">
      <div className="safe-t" />
      <TopBarBack title={`${m}/${d}(${dow}) 예약`} backHref="/booking" />
      <div className="scroll">
        <div className="resv-body">
          <div id="resv-day-list">
            {items.length === 0 ? (
              <div className="resv-empty">📅 이 날짜에 예약이 없습니다</div>
            ) : (
              items.map((r) => (
                <Link href={`/booking/${r.id}`} className={`resv-item admin ${r.status}`} key={r.id}>
                  <div className="resv-item-body">
                    <div className="resv-item-top">
                      {r.time && <span className="resv-time">{r.time}</span>}
                      <span className="resv-name">{r.name}</span>
                      {r.car_num && (
                        <span className="resv-car">
                          {r.car_num}
                          {r.car_model ? ` · ${r.car_model}` : ""}
                        </span>
                      )}
                      {r.is_addon && <span className="resv-status-badge accepted">구독 추가</span>}
                    </div>
                    {r.loc && <div className="resv-loc">📍 {r.loc}</div>}
                    {r.phone && <div className="resv-phone">📞 {r.phone}</div>}
                    {r.note && <div className="resv-note">{r.note}</div>}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
