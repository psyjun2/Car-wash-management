import { notFound, redirect } from "next/navigation";
import { TopBarBack } from "@/components/TopBarBack";
import { VehicleForm } from "@/components/VehicleForm";
import { getSessionInfo } from "@/lib/auth/session";
import { getVehicle } from "@/lib/data/vehicles";
import { listApartmentComplexes } from "@/lib/data/apartment-complexes";

type Params = { params: Promise<{ id: string }> };

export default async function EditVehiclePage({ params }: Params) {
  const { id } = await params;
  const { user, isAdmin } = await getSessionInfo();
  if (!user) redirect("/vehicles");

  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();
  if (!isAdmin && vehicle.user_id !== user.id) redirect("/vehicles");

  const apartmentComplexes = isAdmin ? await listApartmentComplexes() : [];

  return (
    <div className="page on" id="pg-vehicle-form">
      <div className="safe-t" />
      <TopBarBack title="차량 정보 수정" backHref="/vehicles" />
      <VehicleForm vehicle={vehicle} isAdmin={isAdmin} apartmentComplexes={apartmentComplexes} />
    </div>
  );
}
