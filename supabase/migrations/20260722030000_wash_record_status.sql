-- 차량 상세 캘린더에서 날짜별 세차 진행 상태(예정/세차중/세차완료)를 표시하기 위한 컬럼
alter table wash_records add column if not exists status text not null default 'scheduled';
alter table wash_records drop constraint if exists wash_records_status_check;
alter table wash_records add constraint wash_records_status_check
  check (status in ('scheduled','washing','done'));
