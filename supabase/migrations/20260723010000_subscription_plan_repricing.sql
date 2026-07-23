-- 경쟁사(미소/차봇 등) 방문세차 구독 가격 조사 + 토스페이먼츠 카드수수료/부가세(약 10~13%)를
-- 반영해 구독 요금을 재조정합니다. 기존 구독자의 plan_id를 보존하기 위해
-- delete+insert 대신 update로 가격만 변경합니다.
-- 공식: 구독 회당가 = 일회성 외부세차 가격 × (1 - 방문빈도별 할인율)
--   격주1회(월2회) -10%, 주1회(월4회) -20%, 주2회(월8회) -30%

update subscription_plans set price = 36000  where car_size = '소형' and frequency = 'biweekly';
update subscription_plans set price = 64000  where car_size = '소형' and frequency = 'weekly';
update subscription_plans set price = 112000 where car_size = '소형' and frequency = 'twice_weekly';

update subscription_plans set price = 45000  where car_size = '중형' and frequency = 'biweekly';
update subscription_plans set price = 80000  where car_size = '중형' and frequency = 'weekly';
update subscription_plans set price = 140000 where car_size = '중형' and frequency = 'twice_weekly';

update subscription_plans set price = 57000  where car_size = '대형' and frequency = 'biweekly';
update subscription_plans set price = 102000 where car_size = '대형' and frequency = 'weekly';
update subscription_plans set price = 180000 where car_size = '대형' and frequency = 'twice_weekly';
