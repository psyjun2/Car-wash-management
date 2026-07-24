import { notFound, redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { TopBarBack } from "@/components/TopBarBack";
import { VehicleDetailView } from "@/components/VehicleDetailView";
import { getSessionInfo } from "@/lib/auth/session";
import { getVehicle } from "@/lib/data/vehicles";
import { listWashRecords } from "@/lib/data/wash-records";
import { listReservationsForVehicle } from "@/lib/data/reservations";
import { getSubscriptionForVehicle } from "@/lib/data/subscriptions";

type Params = { params: Promise<{ id: string }> };

export default async function VehicleDetailPage({ params }: Params) {
  const { id } = await params;
  const { user, isAdmin } = await getSessionInfo();
  if (!user) redirect("/vehicles");

  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();
  if (!isAdmin && vehicle.user_id !== user.id) redirect("/vehicles");

  const [records, reservations, subscriptionInfo] = await Promise.all([
    listWashRecords({ vehicleId: id, userId: user.id, isAdmin }),
    listReservationsForVehicle(id),
    getSubscriptionForVehicle(id),
  ]);

  return (
    <div className="page on" id="pg-vehicle-detail">
      <div className="safe-t" />
      <TopBarBack title={vehicle.car_num || "차량 상세"} backHref="/vehicles" />
      <div className="scroll">
        <div className="resv-body">
          <VehicleDetailView
            vehicleId={id}
            isAdmin={isAdmin}
            records={records}
            reservations={reservations}
            subscriptionInfo={subscriptionInfo}
          />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
