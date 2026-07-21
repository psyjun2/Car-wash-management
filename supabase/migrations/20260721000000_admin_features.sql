-- 예약 상태(수락/거절) 및 차량-예약/구독 연동을 위한 스키마 변경
-- (이번 세션에서 Supabase에 직접 적용했던 변경사항을 마이그레이션 파일로 정리)

-- reservations: 상태값 + 연동된 차량 항목 참조
alter table reservations add column if not exists status text not null default 'pending';
alter table reservations drop constraint if exists reservations_status_check;
alter table reservations add constraint reservations_status_check
  check (status in ('pending','accepted','rejected'));
alter table reservations add column if not exists synced_vehicle_id uuid references vehicles(id) on delete set null;

-- vehicles: 관리자 전용 추가 필드 (주차 위치 / 결제여부 / 특이사항)
alter table vehicles add column if not exists parking_loc text;
alter table vehicles add column if not exists payment_plan text;
alter table vehicles add column if not exists note text;

-- apartment_complexes: 차량 등록 시 주차 위치 선택용 아파트 단지 목록 (관리자 전용)
create table if not exists apartment_complexes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);
alter table apartment_complexes enable row level security;

drop policy if exists "admin can view apartment complexes" on apartment_complexes;
create policy "admin can view apartment complexes" on apartment_complexes for select
  using (exists (select 1 from admins a where a.user_id = auth.uid()));

drop policy if exists "admin can insert apartment complexes" on apartment_complexes;
create policy "admin can insert apartment complexes" on apartment_complexes for insert
  with check (exists (select 1 from admins a where a.user_id = auth.uid()));

-- subscriptions: 연동된 차량 항목 참조 + subscriptions_public 뷰에 반영
alter table subscriptions add column if not exists synced_vehicle_id uuid references vehicles(id) on delete set null;

create or replace view subscriptions_public as
  select id, user_id, plan_id, status, next_billing_date, created_at, synced_vehicle_id
  from subscriptions;

drop policy if exists "admin updates subscriptions" on subscriptions;
create policy "admin updates subscriptions" on subscriptions for update
  using (exists (select 1 from admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from admins a where a.user_id = auth.uid()));

-- reservations RLS 정리: 관리자 조회 정책 추가, 미인증 사용자(anon)에게
-- 전체 예약 읽기/쓰기를 허용하던 위험한 정책 제거
drop policy if exists "admin views all reservations" on reservations;
create policy "admin views all reservations" on reservations for select
  using (exists (select 1 from admins a where a.user_id = auth.uid()));

drop policy if exists "public can read reservations" on reservations;
drop policy if exists "public can insert reservations" on reservations;
drop policy if exists "public can update reservations" on reservations;
drop policy if exists "public can delete reservations" on reservations;
