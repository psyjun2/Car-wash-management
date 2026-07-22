-- 예약 취소 시, 본인 소유 차량의 "예정(scheduled)" 상태 세차 일정만 지울 수 있도록
-- 하는 제한된 함수. 이미 세차중/완료로 진행된 기록은 고객이 지울 수 없고,
-- 차량 자체는 이 함수로 절대 삭제되지 않습니다.
create or replace function public.unschedule_wash_record(p_vehicle_id uuid, p_wash_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from vehicles v where v.id = p_vehicle_id and v.user_id = auth.uid()
  ) then
    raise exception '본인 소유 차량이 아닙니다';
  end if;

  delete from wash_records
  where vehicle_id = p_vehicle_id and wash_date = p_wash_date and status = 'scheduled';
end;
$$;

grant execute on function public.unschedule_wash_record(uuid, date) to authenticated;
