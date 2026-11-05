-- 나 오늘 어디 뛰어? : 초기 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run 하면 됩니다.

create table if not exists public.teams (
  id           uuid primary key default gen_random_uuid(),
  -- 구글 로그인한 계정 1개당 팀 1개 (나중에 여러 팀이 필요하면 unique 만 제거)
  owner_id     uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 30),
  -- 팀원에게 뿌리는 고정 공유 링크의 비밀 문자열 (추측 불가, 64자)
  share_token  text not null unique default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  -- 명단, 참석, 4쿼터 라인업, 점선 위치 등 앱 상태 전체
  state        jsonb not null default '{}'::jsonb,
  -- 수익화 대비: free / pro
  plan         text not null default 'free',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists teams_touch on public.teams;
create trigger teams_touch before update on public.teams
for each row execute function public.touch_updated_at();

-- 접근 권한: 로그인한 본인의 팀만 읽고 쓸 수 있다.
alter table public.teams enable row level security;

revoke all on public.teams from anon, authenticated;
grant select on public.teams to authenticated;
grant insert (name, state) on public.teams to authenticated;
grant update (name, state) on public.teams to authenticated;
grant delete on public.teams to authenticated;

drop policy if exists teams_select_own on public.teams;
create policy teams_select_own on public.teams for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists teams_insert_own on public.teams;
create policy teams_insert_own on public.teams for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists teams_update_own on public.teams;
create policy teams_update_own on public.teams for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists teams_delete_own on public.teams;
create policy teams_delete_own on public.teams for delete to authenticated
  using (owner_id = (select auth.uid()));

-- 공유 링크: 로그인 없이 토큰으로 팀 이름과 라인업만 읽는다 (토큰 자체는 돌려주지 않음).
create or replace function public.get_shared_team(p_token text)
returns table (name text, state jsonb, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select t.name, t.state, t.updated_at
  from public.teams t
  where t.share_token = p_token
  limit 1
$$;

revoke all on function public.get_shared_team(text) from public;
grant execute on function public.get_shared_team(text) to anon, authenticated;

-- 공유 링크가 유출됐을 때 새 링크로 교체한다 (기존 링크는 즉시 무효).
create or replace function public.rotate_share_token()
returns text
language plpgsql security definer set search_path = public as $$
declare
  new_token text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  update public.teams set share_token = new_token where owner_id = auth.uid();
  return new_token;
end $$;

revoke all on function public.rotate_share_token() from public;
grant execute on function public.rotate_share_token() to authenticated;
