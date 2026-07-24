import { redirect } from "next/navigation";
import { TopBarBack } from "@/components/TopBarBack";
import { VehDayActions } from "@/components/VehDayActions";
import { VehicleCard } from "@/components/VehicleCard";
import { getSessionInfo } from "@/lib/auth/session";
import { listVehicles, type Vehicle } from "@/lib/data/vehicles";
import { toDateKey } from "@/lib/dateKey";

type Params = { params: Promise<{ date: string }> };

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

function vehDateKey(v: Vehicle): string {
  const d = new Date(v.created_at);
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

export default async function AdminVehDayPage({ params }: Params) {
  const { date } = await params;
  const { user, isAdmin } = await getSessionInfo();
  if (!user || !isAdmin) redirect("/vehicles");

  const [y, m, d] = date.split("-").map(Number);
  const dow = DOW[new Date(y, m - 1, d).getDay()];

  const vehicles = await listVehicles({ userId: user.id, isAdmin });
  const list = vehicles.filter((v) => vehDateKey(v) === date);

  return (
    <div className="page on" id="pg-veh-day">
      <div className="safe-t" />
      <TopBarBack title={`${m}/${d}(${dow}) 등록 차량`} backHref="/vehicles" />
      <div className="scroll">
        <div className="resv-body">
          <VehDayActions />
          <div id="veh-day-list">
            {list.length === 0 ? (
              <div className="resv-empty">🚗 이 날짜에 등록된 차량이 없습니다</div>
            ) : (
              list.map((v) => <VehicleCard key={v.id} vehicle={v} isAdmin={isAdmin} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
