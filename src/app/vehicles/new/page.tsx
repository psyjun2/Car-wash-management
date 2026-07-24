import { redirect } from "next/navigation";
import { TopBarBack } from "@/components/TopBarBack";
import { VehicleForm } from "@/components/VehicleForm";
import { getSessionInfo } from "@/lib/auth/session";
import { listApartmentComplexes } from "@/lib/data/apartment-complexes";

type Params = { searchParams: Promise<{ returnTo?: string }> };

export default async function NewVehiclePage({ searchParams }: Params) {
  const { returnTo } = await searchParams;
  const { user, isAdmin } = await getSessionInfo();
  if (!user) redirect("/vehicles");

  const apartmentComplexes = isAdmin ? await listApartmentComplexes() : [];
  const backHref = returnTo || "/vehicles";

  return (
    <div className="page on" id="pg-vehicle-form">
      <div className="safe-t" />
      <TopBarBack title="차량 등록" backHref={backHref} />
      <VehicleForm vehicle={null} isAdmin={isAdmin} apartmentComplexes={apartmentComplexes} returnTo={returnTo} />
    </div>
  );
}
