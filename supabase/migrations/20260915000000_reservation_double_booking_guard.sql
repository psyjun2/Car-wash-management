-- 같은 날짜/시간에 거절되지 않은(pending·accepted) 예약이 두 건 이상 쌓이는
-- 동시성 문제(두 고객이 동시에 같은 시간대를 예약)를 DB 레벨에서 막는다.
-- 시간 미지정(time is null) 예약은 시간대 충돌 개념이 없으므로 대상에서 제외.
drop index if exists reservations_date_time_active_uidx;
create unique index reservations_date_time_active_uidx
  on reservations (date, time)
  where status <> 'rejected' and time is not null;
