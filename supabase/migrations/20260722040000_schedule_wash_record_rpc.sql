-- 고객이 예약할 때, 본인 소유 차량에 한해 "예정(scheduled)" 상태의 세차 일정 1건만
-- 생성할 수 있도록 하는 제한된 함수. wash_records에 대한 직접 쓰기 권한은 여전히
-- 관리자 전용이며(RLS), 고객은 상태를 washing/done으로 바꾸거나 기존 기록을
-- 수정/삭제할 수 없습니다.
create or replace function public.schedule_wash_record(p_vehicle_id uuid, p_wash_date date)
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

  if exists (
    select 1 from wash_records where vehicle_id = p_vehicle_id and wash_date = p_wash_date
  ) then
    return;
  end if;

  insert into wash_records (vehicle_id, wash_date, status)
  values (p_vehicle_id, p_wash_date, 'scheduled');
end;
$$;

grant execute on function public.schedule_wash_record(uuid, date) to authenticated;
