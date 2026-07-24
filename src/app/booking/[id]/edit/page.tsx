import { notFound, redirect } from "next/navigation";
import { ReservationForm } from "@/components/ReservationForm";
import { getSessionInfo } from "@/lib/auth/session";
import { getReservation, listReservations } from "@/lib/data/reservations";
import { listVehicles } from "@/lib/data/vehicles";

type Params = { params: Promise<{ id: string }> };

export default async function EditReservationPage({ params }: Params) {
  const { id } = await params;
  const { user, isAdmin } = await getSessionInfo();
  if (!user || isAdmin) redirect("/booking");

  const reservation = await getReservation(id);
  if (!reservation) notFound();
  if (reservation.user_id !== user.id) redirect("/booking");

  const [reservations, vehicles] = await Promise.all([
    listReservations({ userId: user.id, isAdmin }),
    listVehicles({ userId: user.id, isAdmin: false }),
  ]);

  return (
    <div className="page on" id="pg-resv-form">
      <div className="safe-t" />
      <ReservationForm reservation={reservation} reservations={reservations} vehicles={vehicles} backHref={`/booking/${id}`} />
    </div>
  );
}
