-- 구독 셀프서비스: 고객이 직접 자동결제 켜기/끄기, 구독 취소를 할 수 있도록
-- 제한된 RPC 함수를 추가합니다. subscriptions 테이블 직접 UPDATE는 여전히
-- 관리자 전용(RLS)이며, 고객은 이 함수들을 통해서만 본인 구독의 상태를 바꿀 수 있습니다.

alter table subscriptions add column if not exists auto_renew boolean not null default true;

create or replace view subscriptions_public as
  select id, user_id, plan_id, status, next_billing_date, created_at, synced_vehicle_id, auto_renew
  from subscriptions;

create or replace function public.cancel_my_subscription(p_subscription_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update subscriptions
  set status = 'canceled'
  where id = p_subscription_id and user_id = auth.uid();

  if not found then
    raise exception '본인 구독만 취소할 수 있습니다';
  end if;
end;
$$;

create or replace function public.set_subscription_auto_renew(p_subscription_id uuid, p_auto_renew boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update subscriptions
  set auto_renew = p_auto_renew
  where id = p_subscription_id and user_id = auth.uid() and status = 'active';

  if not found then
    raise exception '본인 활성 구독만 변경할 수 있습니다';
  end if;
end;
$$;

grant execute on function public.cancel_my_subscription(uuid) to authenticated;
grant execute on function public.set_subscription_auto_renew(uuid, boolean) to authenticated;
