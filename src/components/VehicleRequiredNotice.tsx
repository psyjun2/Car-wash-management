import Link from "next/link";

// Small gold reminder box asking the customer to register a vehicle,
// shared between the booking and subscribe flows.
export function VehicleRequiredNotice({ returnTo }: { returnTo: string }) {
  return (
    <div className="veh-required-box">
      <div className="veh-required-box-text">먼저 차량을 등록해주세요</div>
      <Link href={`/vehicles/new?returnTo=${encodeURIComponent(returnTo)}`} className="veh-required-box-btn">
        + 차량 등록
      </Link>
    </div>
  );
}
