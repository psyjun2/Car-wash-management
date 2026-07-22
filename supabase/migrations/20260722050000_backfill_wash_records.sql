-- 백필: 예전 예약들은 예약마다 별도의 "그림자" 차량이 생성되어 있어
-- 고객이 보는 실제 등록 차량(car_num 동일, payment_plan is null)과 연동되어 있지
-- 않았습니다. 이를 고객의 실제 차량으로 재연결하고, 누락된 예정(scheduled)
-- wash_records 항목을 채워 넣습니다. 여러 번 실행해도 안전합니다.

with resolved as (
  select
    r.id as reservation_id,
    r.date as wash_date,
    coalesce(
      (select v.id from vehicles v
        where v.user_id = r.user_id and v.car_num = r.car_num and v.payment_plan is null
        order by v.created_at asc limit 1),
      (select v.id from vehicles v
        where v.user_id = r.user_id and v.car_num = r.car_num
        order by v.created_at asc limit 1)
    ) as vehicle_id
  from reservations r
  where r.status = 'accepted' and r.user_id is not null and r.car_num is not null
)
update reservations r
set synced_vehicle_id = resolved.vehicle_id
from resolved
where r.id = resolved.reservation_id
  and resolved.vehicle_id is not null
  and r.synced_vehicle_id is distinct from resolved.vehicle_id;

insert into wash_records (vehicle_id, wash_date, status)
select r.synced_vehicle_id, r.date, 'scheduled'
from reservations r
where r.synced_vehicle_id is not null
  and r.status = 'accepted'
  and not exists (
    select 1 from wash_records w
    where w.vehicle_id = r.synced_vehicle_id and w.wash_date = r.date
  );
