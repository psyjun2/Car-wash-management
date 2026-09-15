-- 예약 흐름을 "신청 → 관리자 승인 → 결제 → 확정"으로 바꾸기 위해 승인은 됐지만
-- 아직 결제가 안 된 상태(awaiting_payment)를 추가한다. Toss 연동 전까지는
-- 관리자가 수동으로 결제 확인 처리해 accepted로 넘긴다.
alter table reservations drop constraint if exists reservations_status_check;
alter table reservations add constraint reservations_status_check
  check (status in ('pending','awaiting_payment','accepted','rejected'));
