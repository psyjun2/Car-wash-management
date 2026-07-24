import { redirect } from "next/navigation";
import { ReservationForm } from "@/components/ReservationForm";
import { getSessionInfo, kakaoNickname } from "@/lib/auth/session";
import { listReservations } from "@/lib/data/reservations";
import { listVehicles } from "@/lib/data/vehicles";

type Params = { searchParams: Promise<{ date?: string; time?: string }> };

export default async function NewReservationPage({ searchParams }: Params) {
  const { date, time } = await searchParams;
  const { user, isAdmin } = await getSessionInfo();
  if (!user || isAdmin) redirect("/booking");

  const vehicles = await listVehicles({ userId: user.id, isAdmin: false });
  if (vehicles.length === 0) redirect("/booking");

  const reservations = await listReservations({ userId: user.id, isAdmin });

  return (
    <div className="page on" id="pg-resv-form">
      <div className="safe-t" />
      <ReservationForm
        reservation={null}
        reservations={reservations}
        vehicles={vehicles}
        defaultDate={date}
        defaultTime={time}
        defaultName={kakaoNickname(user)}
        backHref="/booking"
      />
    </div>
  );
}
