-- 구독결제 플랜을 차량 크기(소형/중형/대형) x 주기(주1회/주2회/격주)로 세분화합니다.
-- 아직 실제 구독(subscriptions)이 하나도 없어 기존 자리표시자 플랜 3건을 안전하게 교체합니다.
alter table subscription_plans add column if not exists car_size text;
alter table subscription_plans add column if not exists frequency text;
alter table subscription_plans add column if not exists visits_per_month integer;

delete from subscription_plans;

insert into subscription_plans (name, frequency_label, price, active, car_size, frequency, visits_per_month) values
('소형 · 주 1회 (월 4회)', '주 1회 (월 4회)', 50000, true, '소형', 'weekly', 4),
('소형 · 주 2회 (월 8회)', '주 2회 (월 8회)', 80000, true, '소형', 'twice_weekly', 8),
('소형 · 격주 1회 (월 2회)', '격주 1회 (월 2회)', 30000, true, '소형', 'biweekly', 2),
('중형 · 주 1회 (월 4회)', '주 1회 (월 4회)', 60000, true, '중형', 'weekly', 4),
('중형 · 주 2회 (월 8회)', '주 2회 (월 8회)', 100000, true, '중형', 'twice_weekly', 8),
('중형 · 격주 1회 (월 2회)', '격주 1회 (월 2회)', 40000, true, '중형', 'biweekly', 2),
('대형 · 주 1회 (월 4회)', '주 1회 (월 4회)', 80000, true, '대형', 'weekly', 4),
('대형 · 주 2회 (월 8회)', '주 2회 (월 8회)', 130000, true, '대형', 'twice_weekly', 8),
('대형 · 격주 1회 (월 2회)', '격주 1회 (월 2회)', 50000, true, '대형', 'biweekly', 2);
