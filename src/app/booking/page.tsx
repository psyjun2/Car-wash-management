import { BottomNav } from "@/components/BottomNav";
import { TopBarBack } from "@/components/TopBarBack";
import { LoginBar } from "@/components/LoginBar";
import { BookingView } from "@/components/BookingView";
import { VehicleRequiredNotice } from "@/components/VehicleRequiredNotice";
import { getSessionInfo, kakaoNickname } from "@/lib/auth/session";
import { listReservations } from "@/lib/data/reservations";
import { listVehicles } from "@/lib/data/vehicles";

export default async function BookingPage() {
  const { user, isAdmin } = await getSessionInfo();
  const reservations = user ? await listReservations({ userId: user.id, isAdmin }) : [];
  const hasVehicle = user && !isAdmin ? (await listVehicles({ userId: user.id, isAdmin: false })).length > 0 : true;

  return (
    <div className="page on" id="pg-booking">
      <div className="safe-t" />
      <TopBarBack title="세차 예약" backHref="/" />
      <div className="scroll">
        <div className="resv-body">
          {!user && (
            <div id="resv-guest-msg" className="veh-guest-msg">
              카카오 로그인해야
              <br />
              이용 가능합니다
            </div>
          )}

          <div className="resv-login-bar login-bar-slot">
            <LoginBar nickname={user ? kakaoNickname(user) : null} isAdmin={isAdmin} />
          </div>

          {user && !isAdmin && !hasVehicle && <VehicleRequiredNotice returnTo="/booking" />}

          {user && (isAdmin || hasVehicle) && <BookingView reservations={reservations} isAdmin={isAdmin} userId={user.id} />}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
