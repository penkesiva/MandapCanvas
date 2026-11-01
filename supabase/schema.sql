-- MandapCanvas storage schema for Supabase.
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again.

-- Key/value records (albums, users, credits, locks, rate limits).
create table if not exists public.mc_kv (
  key text primary key,
  value text not null,
  expires_at timestamptz
);
create index if not exists mc_kv_expires_idx on public.mc_kv (expires_at) where expires_at is not null;

-- Append-only lists (newest first when read).
create table if not exists public.mc_list (
  id bigserial primary key,
  key text not null,
  value text not null
);
create index if not exists mc_list_key_idx on public.mc_list (key, id desc);

-- Counters grouped under a key (daily stats, family votes).
create table if not exists public.mc_hash (
  key text not null,
  field text not null,
  value bigint not null default 0,
  primary key (key, field)
);

-- Only the server (service role key) may touch these tables.
alter table public.mc_kv enable row level security;
alter table public.mc_list enable row level security;
alter table public.mc_hash enable row level security;

create or replace function public.mc_get(p_key text)
returns text language sql stable as $$
  select value from public.mc_kv
  where key = p_key and (expires_at is null or expires_at > now());
$$;

create or replace function public.mc_set(p_key text, p_value text, p_ex integer default null, p_nx boolean default false)
returns boolean language plpgsql as $$
declare
  n integer;
begin
  delete from public.mc_kv where key = p_key and expires_at is not null and expires_at <= now();
  if p_nx then
    insert into public.mc_kv (key, value, expires_at)
    values (p_key, p_value, case when p_ex is null then null else now() + make_interval(secs => p_ex) end)
    on conflict (key) do nothing;
    get diagnostics n = row_count;
    return n > 0;
  end if;
  insert into public.mc_kv (key, value, expires_at)
  values (p_key, p_value, case when p_ex is null then null else now() + make_interval(secs => p_ex) end)
  on conflict (key) do update set value = excluded.value, expires_at = excluded.expires_at;
  return true;
end;
$$;

create or replace function public.mc_incrby(p_key text, p_by bigint)
returns bigint language plpgsql as $$
declare
  v bigint;
begin
  delete from public.mc_kv where key = p_key and expires_at is not null and expires_at <= now();
  insert into public.mc_kv (key, value) values (p_key, p_by::text)
  on conflict (key) do update set value = ((public.mc_kv.value)::bigint + p_by)::text
  returning value::bigint into v;
  return v;
end;
$$;

create or replace function public.mc_expire(p_key text, p_seconds integer)
returns void language sql as $$
  update public.mc_kv set expires_at = now() + make_interval(secs => p_seconds) where key = p_key;
$$;

create or replace function public.mc_del(p_key text)
returns void language sql as $$
  delete from public.mc_kv where key = p_key;
  delete from public.mc_list where key = p_key;
  delete from public.mc_hash where key = p_key;
$$;

create or replace function public.mc_hincrby(p_key text, p_field text, p_by bigint)
returns bigint language sql as $$
  insert into public.mc_hash (key, field, value) values (p_key, p_field, p_by)
  on conflict (key, field) do update set value = public.mc_hash.value + p_by
  returning value;
$$;

-- Lock the functions down to the server too.
revoke all on function public.mc_get(text) from public, anon, authenticated;
revoke all on function public.mc_set(text, text, integer, boolean) from public, anon, authenticated;
revoke all on function public.mc_incrby(text, bigint) from public, anon, authenticated;
revoke all on function public.mc_expire(text, integer) from public, anon, authenticated;
revoke all on function public.mc_del(text) from public, anon, authenticated;
revoke all on function public.mc_hincrby(text, text, bigint) from public, anon, authenticated;

-- Explicit grants, so this works with "Automatically expose new tables" turned off.
revoke all on public.mc_kv, public.mc_list, public.mc_hash from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on public.mc_kv, public.mc_list, public.mc_hash to service_role;
grant usage, select on sequence public.mc_list_id_seq to service_role;
grant execute on function public.mc_get(text) to service_role;
grant execute on function public.mc_set(text, text, integer, boolean) to service_role;
grant execute on function public.mc_incrby(text, bigint) to service_role;
grant execute on function public.mc_expire(text, integer) to service_role;
grant execute on function public.mc_del(text) to service_role;
grant execute on function public.mc_hincrby(text, text, bigint) to service_role;

-- Public image bucket. Paths are unguessable; the app never lists the bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 15728640, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
