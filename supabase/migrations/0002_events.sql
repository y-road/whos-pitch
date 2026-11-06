-- 이탈 측정(퍼널) 기록 : Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run 하세요.
-- 마지막 insert 줄의 이메일을 "내가 서비스에 로그인할 때 쓰는 구글 이메일"로 바꿔서 실행해야 /admin 이 열립니다.

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  vid         text not null check (char_length(vid) between 8 and 64),   -- 브라우저별 익명 방문자 번호
  user_id     uuid default auth.uid(),
  name        text not null check (char_length(name) between 1 and 40),  -- 단계 이름
  props       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists events_name_created on public.events (name, created_at);

alter table public.events enable row level security;
revoke all on public.events from anon, authenticated;
grant insert (vid, name, props) on public.events to anon, authenticated;

drop policy if exists events_insert_any on public.events;
create policy events_insert_any on public.events for insert to anon, authenticated with check (true);

-- 관리자(나)만 집계를 볼 수 있다.
create table if not exists public.admin_emails (email text primary key);
alter table public.admin_emails enable row level security;
revoke all on public.admin_emails from anon, authenticated;

create or replace function public.admin_funnel(p_days int default 30)
returns table (ev_name text, visitors bigint, total bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.admin_emails a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select e.name, count(distinct e.vid), count(*)
    from public.events e
    where e.created_at >= now() - make_interval(days => greatest(p_days, 1))
    group by e.name;
end $$;

revoke all on function public.admin_funnel(int) from public, anon;
grant execute on function public.admin_funnel(int) to authenticated;

-- ★ 이메일을 바꿔서 실행 ★
insert into public.admin_emails (email) values ('여기에-내-구글-이메일@gmail.com') on conflict do nothing;
