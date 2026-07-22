-- 세차 일정이 일회성 예약인지 구독 서비스인지 구분하기 위한 컬럼.
-- 예약 시 자동 생성되는 일정은 기본값(onetime)을 사용하고,
-- 구독 서비스 일정은 관리자가 직접 생성/지정합니다.
alter table wash_records add column if not exists service_type text not null default 'onetime';
alter table wash_records drop constraint if exists wash_records_service_type_check;
alter table wash_records add constraint wash_records_service_type_check
  check (service_type in ('onetime','subscription'));
