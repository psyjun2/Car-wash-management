-- 일회성 세차신청 세차 종류(외부/내부/둘다) + 결제 금액
alter table reservations add column if not exists wash_type text not null default 'exterior';
alter table reservations drop constraint if exists reservations_wash_type_check;
alter table reservations add constraint reservations_wash_type_check
  check (wash_type in ('exterior','interior','both'));
alter table reservations add column if not exists price integer;
