-- 중형·주1회(월4회) 구독가를 "카드수수료+부가세 차감 후 순수익 50,000원" 기준으로 역산해
-- 회당 42% 할인으로 재설정하고, 격주(-30%)/주2회(-52%)도 같은 비율 체계로 재조정합니다.
-- (기존 구독자 plan_id 보존을 위해 delete+insert 대신 update 사용)

update subscription_plans set price = 28000 where car_size = '소형' and frequency = 'biweekly';
update subscription_plans set price = 46000 where car_size = '소형' and frequency = 'weekly';
update subscription_plans set price = 77000 where car_size = '소형' and frequency = 'twice_weekly';

update subscription_plans set price = 35000 where car_size = '중형' and frequency = 'biweekly';
update subscription_plans set price = 58000 where car_size = '중형' and frequency = 'weekly';
update subscription_plans set price = 96000 where car_size = '중형' and frequency = 'twice_weekly';

update subscription_plans set price = 45000  where car_size = '대형' and frequency = 'biweekly';
update subscription_plans set price = 74000  where car_size = '대형' and frequency = 'weekly';
update subscription_plans set price = 123000 where car_size = '대형' and frequency = 'twice_weekly';
