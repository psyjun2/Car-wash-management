-- 구독자 전용 "내부세차 1회 추가" 신청을 일반 예약과 구분하기 위한 플래그
alter table reservations add column if not exists is_addon boolean not null default false;
