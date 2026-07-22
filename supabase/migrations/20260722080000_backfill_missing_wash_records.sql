-- 백필: 예약 날짜 수정 시 세차 캘린더가 동기화되지 않던 버그로 인해
-- 누락된 예정(scheduled) wash_records 항목을 채워 넣습니다. 여러 번 실행해도 안전합니다.
insert into wash_records (vehicle_id, wash_date, status, service_type)
select r.synced_vehicle_id, r.date, 'scheduled', 'onetime'
from reservations r
where r.synced_vehicle_id is not null
  and r.status = 'accepted'
  and not exists (
    select 1 from wash_records w
    where w.vehicle_id = r.synced_vehicle_id and w.wash_date = r.date
  );
