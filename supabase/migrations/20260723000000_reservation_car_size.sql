-- 일회성 세차신청 가격을 차량 크기(소형/중형/대형)별로 구분하기 위한 컬럼
alter table reservations add column if not exists car_size text not null default '소형';
alter table reservations drop constraint if exists reservations_car_size_check;
alter table reservations add constraint reservations_car_size_check
  check (car_size in ('소형','중형','대형'));
