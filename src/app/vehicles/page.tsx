import { BottomNav } from "@/components/BottomNav";
import { TopBarBack } from "@/components/TopBarBack";
import { LoginBar } from "@/components/LoginBar";
import { VehiclesView } from "@/components/VehiclesView";
import { getSessionInfo, kakaoNickname } from "@/lib/auth/session";
import { listVehicles } from "@/lib/data/vehicles";

export default async function VehiclesPage() {
  const { user, isAdmin } = await getSessionInfo();
  const vehicles = user ? await listVehicles({ userId: user.id, isAdmin }) : [];

  return (
    <div className="page on" id="pg-vehicles">
      <div className="safe-t" />
      <TopBarBack title={isAdmin ? "고객차량 관리" : "내 차량 확인"} backHref="/" />
      <div className="scroll">
        <div className="veh-body">
          {!user && (
            <div id="veh-guest-msg" className="veh-guest-msg">
              카카오 로그인해야
              <br />
              이용 가능합니다
            </div>
          )}

          <div className="login-bar-slot">
            <LoginBar nickname={user ? kakaoNickname(user) : null} isAdmin={isAdmin} />
          </div>

          {user && (
            <div id="veh-main" className="veh-main">
              <VehiclesView vehicles={vehicles} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
