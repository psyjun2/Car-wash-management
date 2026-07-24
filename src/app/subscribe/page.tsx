import { BottomNav } from "@/components/BottomNav";
import { TopBarBack } from "@/components/TopBarBack";
import { LoginBar } from "@/components/LoginBar";
import { SubscribeView } from "@/components/SubscribeView";
import { VehicleRequiredNotice } from "@/components/VehicleRequiredNotice";
import { getSessionInfo, kakaoNickname } from "@/lib/auth/session";
import { listActivePlans, getMySubscription, listAllSubscriptions } from "@/lib/data/subscriptions";
import { listVehicles } from "@/lib/data/vehicles";

export default async function SubscribePage() {
  const { user, isAdmin } = await getSessionInfo();
  const plans = user ? await listActivePlans() : [];
  const mySubscription = user && !isAdmin ? await getMySubscription(user.id) : null;
  const allSubscriptions = user && isAdmin ? await listAllSubscriptions() : [];
  // Existing subscribers keep access to management even without a vehicle
  // currently on file — the gate only applies before signing up.
  const hasVehicle =
    user && !isAdmin && !mySubscription ? (await listVehicles({ userId: user.id, isAdmin: false })).length > 0 : true;

  return (
    <div className="page on" id="pg-subscribe">
      <div className="safe-t" />
      <TopBarBack title={isAdmin ? "월 멤버십 신청자" : "월 멤버십 가입"} backHref="/" />
      <div className="scroll">
        <div className="sub-body">
          {!user && (
            <div id="sub-guest-msg" className="veh-guest-msg">
              카카오 로그인해야
              <br />
              이용 가능합니다
            </div>
          )}

          <div className="login-bar-slot">
            <LoginBar nickname={user ? kakaoNickname(user) : null} isAdmin={isAdmin} />
          </div>

          {user && !isAdmin && !hasVehicle && <VehicleRequiredNotice returnTo="/subscribe" />}

          {user && (isAdmin || hasVehicle) && (
            <div id="sub-main" className="sub-main">
              <SubscribeView
                isAdmin={isAdmin}
                plans={plans}
                mySubscription={mySubscription}
                allSubscriptions={allSubscriptions}
              />
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
