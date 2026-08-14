-- 갤러리(Before & After) 항목과 사이트 문구(방문가능지역 등)를 코드 하드코딩 대신
-- Supabase에서 관리할 수 있도록 테이블 추가

create table if not exists gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sub text,
  before_photo_url text not null,
  before_alt text,
  after_photo_url text not null,
  after_alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table gallery_items enable row level security;

drop policy if exists "public can read gallery items" on gallery_items;
create policy "public can read gallery items" on gallery_items for select
  using (true);

drop policy if exists "admin writes gallery items" on gallery_items;
create policy "admin writes gallery items" on gallery_items for all
  using (exists (select 1 from admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from admins a where a.user_id = auth.uid()));

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table site_settings enable row level security;

drop policy if exists "public can read site settings" on site_settings;
create policy "public can read site settings" on site_settings for select
  using (true);

drop policy if exists "admin writes site settings" on site_settings;
create policy "admin writes site settings" on site_settings for all
  using (exists (select 1 from admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from admins a where a.user_id = auth.uid()));

insert into site_settings (key, value)
values (
  'service_area',
  '{"lines": ["서울지역 → 강서구,구로구,금천구", "경기지역 → 김포 고촌,풍무,사우동", "", "(원하시는 지역이 있다면 고객센터로 별도문의)"]}'::jsonb
)
on conflict (key) do nothing;
