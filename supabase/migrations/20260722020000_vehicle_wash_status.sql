-- 차량별 실시간 세차 진행 상태 (관리자가 설정, 고객 차량 목록에 표시)
alter table vehicles add column if not exists wash_status text;
alter table vehicles drop constraint if exists vehicles_wash_status_check;
alter table vehicles add constraint vehicles_wash_status_check
  check (wash_status is null or wash_status in ('washing','done'));
