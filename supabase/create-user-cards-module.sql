-- Module de cartes d'identification CECND
-- Execute this migration once in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create sequence if not exists public.user_card_number_seq;

create or replace function public.generate_user_card_number()
returns text
language sql
volatile
as $$
  select 'CECND-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.user_card_number_seq')::text, 4, '0');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  card_number text not null unique default public.generate_user_card_number(),
  qr_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  status text not null default 'active' check (status in ('active', 'inactive', 'lost', 'expired', 'revoked')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 year'),
  created_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  revoked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_cards_revocation_consistency check (
    (status = 'revoked' and revoked_at is not null) or status <> 'revoked'
  )
);

create index if not exists user_cards_qr_token_idx on public.user_cards (qr_token);
create index if not exists user_cards_status_idx on public.user_cards (status);

create table if not exists public.card_scan_logs (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references public.user_cards(id) on delete set null,
  qr_token text,
  scanned_by uuid references public.profiles(id) on delete set null,
  scanned_at timestamptz not null default now(),
  result text not null check (result in ('valid', 'invalid', 'expired', 'revoked', 'inactive', 'user_inactive')),
  user_agent text,
  notes text
);

create index if not exists card_scan_logs_card_id_idx on public.card_scan_logs (card_id);
create index if not exists card_scan_logs_scanned_at_idx on public.card_scan_logs (scanned_at desc);

DROP TRIGGER IF EXISTS user_cards_set_updated_at ON public.user_cards;
create trigger user_cards_set_updated_at
before update on public.user_cards
for each row execute function public.set_updated_at();

alter table public.user_cards enable row level security;
alter table public.card_scan_logs enable row level security;

-- The management screen is reserved to super administrators.
drop policy if exists "Super admins manage user cards" on public.user_cards;
create policy "Super admins manage user cards"
on public.user_cards
for all
to authenticated
using ((select role from public.profiles where id = auth.uid()) = 'superadmin')
with check ((select role from public.profiles where id = auth.uid()) = 'superadmin');

-- Scan history is visible to super admins; authorised operators can only add their own scan.
drop policy if exists "Super admins view card scan logs" on public.card_scan_logs;
create policy "Super admins view card scan logs"
on public.card_scan_logs
for select
to authenticated
using ((select role from public.profiles where id = auth.uid()) = 'superadmin');

drop policy if exists "Operators insert their own card scan logs" on public.card_scan_logs;
create policy "Operators insert their own card scan logs"
on public.card_scan_logs
for insert
to authenticated
with check (
  scanned_by = auth.uid()
  and (select role from public.profiles where id = auth.uid()) in ('superadmin', 'admin')
);

-- The scanner reads a minimal verification payload through this controlled RPC,
-- rather than exposing card tokens or all cards to administrators.
create or replace function public.verify_user_card(p_qr_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  card_row record;
  verification_result text;
begin
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role not in ('superadmin', 'admin') then
    raise exception 'Accès non autorisé à la vérification des cartes';
  end if;

  select
    c.id as card_id,
    c.card_number,
    c.status as card_status,
    c.issued_at,
    c.expires_at,
    p.id as user_id,
    p.full_name,
    p.email,
    p.phone,
    p.role as user_role,
    p.status as user_status,
    p.avatar_url,
    b.name as branch_name,
    coalesce(array_agg(distinct d.name) filter (where d.name is not null), '{}') as departments
  into card_row
  from public.user_cards c
  join public.profiles p on p.id = c.user_id
  left join public.branches b on b.id = p.branch_id
  left join public.department_members dm on dm.profile_id = p.id
  left join public.departments d on d.id = dm.department_id
  where c.qr_token = p_qr_token
  group by c.id, p.id, b.name;

  if not found then
    return jsonb_build_object('result', 'invalid');
  end if;

  if card_row.expires_at < now() and card_row.card_status = 'active' then
    update public.user_cards set status = 'expired' where id = card_row.card_id;
    card_row.card_status := 'expired';
  end if;

  if card_row.user_status is distinct from 'active' then
    verification_result := 'user_inactive';
  elsif card_row.card_status = 'active' then
    verification_result := 'valid';
  elsif card_row.card_status = 'expired' then
    verification_result := 'expired';
  elsif card_row.card_status = 'revoked' then
    verification_result := 'revoked';
  else
    verification_result := 'inactive';
  end if;

  return jsonb_build_object(
    'result', verification_result,
    'card', jsonb_build_object(
      'id', card_row.card_id,
      'cardNumber', card_row.card_number,
      'status', card_row.card_status,
      'issuedAt', card_row.issued_at,
      'expiresAt', card_row.expires_at
    ),
    'user', jsonb_build_object(
      'id', card_row.user_id,
      'fullName', card_row.full_name,
      'email', card_row.email,
      'phone', card_row.phone,
      'role', card_row.user_role,
      'status', card_row.user_status,
      'avatarUrl', card_row.avatar_url,
      'branchName', card_row.branch_name,
      'departments', card_row.departments
    )
  );
end;
$$;

grant execute on function public.verify_user_card(text) to authenticated;