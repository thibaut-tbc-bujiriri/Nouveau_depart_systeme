-- Programme des enseignements CECND
-- Execute this migration manually in the Supabase SQL editor.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.annual_themes (
  id uuid primary key default gen_random_uuid(),
  year integer not null check (year between 1900 and 2200),
  title text not null check (char_length(trim(title)) > 0),
  description text,
  is_active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists annual_themes_one_active_per_year_idx
on public.annual_themes (year)
where is_active = true;

create index if not exists annual_themes_year_idx on public.annual_themes (year desc);
create index if not exists annual_themes_is_active_idx on public.annual_themes (is_active);

create table if not exists public.teaching_programs (
  id uuid primary key default gen_random_uuid(),
  extension_id uuid not null references public.branches(id) on delete cascade,
  annual_theme_id uuid not null references public.annual_themes(id) on delete restrict,
  month integer not null check (month between 1 and 12),
  year integer not null check (year between 1900 and 2200),
  subtheme text not null check (char_length(trim(subtheme)) > 0),
  office_name text not null default 'Bureau des Enseignements',
  signatory_user_id uuid references public.profiles(id) on delete set null,
  signatory_name text not null check (char_length(trim(signatory_name)) > 0),
  signatory_title text not null check (char_length(trim(signatory_title)) > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teaching_programs_unique_extension_month_year unique (extension_id, month, year),
  constraint teaching_programs_published_at_consistency check (
    (status = 'published' and published_at is not null) or status <> 'published'
  )
);

create index if not exists teaching_programs_extension_idx on public.teaching_programs (extension_id);
create index if not exists teaching_programs_theme_idx on public.teaching_programs (annual_theme_id);
create index if not exists teaching_programs_period_idx on public.teaching_programs (year desc, month desc);
create index if not exists teaching_programs_status_idx on public.teaching_programs (status);

create table if not exists public.teaching_program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.teaching_programs(id) on delete cascade,
  session_date date not null,
  activity_type text not null check (char_length(trim(activity_type)) > 0),
  speaker_user_id uuid references public.profiles(id) on delete set null,
  speaker_name text not null check (char_length(trim(speaker_name)) > 0),
  officiant_user_id uuid references public.profiles(id) on delete set null,
  officiant_name text not null check (char_length(trim(officiant_name)) > 0),
  start_time time,
  end_time time,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teaching_program_sessions_time_order check (
    start_time is null or end_time is null or end_time > start_time
  )
);

create index if not exists teaching_program_sessions_program_idx on public.teaching_program_sessions (program_id);
create index if not exists teaching_program_sessions_date_idx on public.teaching_program_sessions (session_date);
create index if not exists teaching_program_sessions_order_idx on public.teaching_program_sessions (program_id, session_date, sort_order);

create or replace function public.validate_teaching_program_session_date()
returns trigger
language plpgsql
as $$
declare
  program_year integer;
  program_month integer;
begin
  select year, month into program_year, program_month
  from public.teaching_programs
  where id = new.program_id;

  if program_year is null then
    raise exception 'Programme des enseignements introuvable';
  end if;

  if extract(year from new.session_date)::integer <> program_year
     or extract(month from new.session_date)::integer <> program_month then
    raise exception 'La date de la séance doit appartenir au mois et à l''année du programme';
  end if;

  return new;
end;
$$;

create or replace function public.prepare_teaching_program_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  elsif new.status <> 'published' then
    new.published_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists annual_themes_set_updated_at on public.annual_themes;
create trigger annual_themes_set_updated_at
before update on public.annual_themes
for each row execute function public.set_updated_at();

drop trigger if exists teaching_programs_prepare_status on public.teaching_programs;
create trigger teaching_programs_prepare_status
before insert or update on public.teaching_programs
for each row execute function public.prepare_teaching_program_status();

drop trigger if exists teaching_programs_set_updated_at on public.teaching_programs;
create trigger teaching_programs_set_updated_at
before update on public.teaching_programs
for each row execute function public.set_updated_at();

drop trigger if exists teaching_program_sessions_validate_date on public.teaching_program_sessions;
create trigger teaching_program_sessions_validate_date
before insert or update on public.teaching_program_sessions
for each row execute function public.validate_teaching_program_session_date();

drop trigger if exists teaching_program_sessions_set_updated_at on public.teaching_program_sessions;
create trigger teaching_program_sessions_set_updated_at
before update on public.teaching_program_sessions
for each row execute function public.set_updated_at();

alter table public.annual_themes enable row level security;
alter table public.teaching_programs enable row level security;
alter table public.teaching_program_sessions enable row level security;

-- Annual themes: readable by authenticated users, managed by super admins only.
drop policy if exists "Authenticated users view annual themes" on public.annual_themes;
create policy "Authenticated users view annual themes"
on public.annual_themes
for select
to authenticated
using (true);

drop policy if exists "Super admins manage annual themes" on public.annual_themes;
create policy "Super admins manage annual themes"
on public.annual_themes
for all
to authenticated
using ((select role::text from public.profiles where id = auth.uid()) = 'superadmin')
with check ((select role::text from public.profiles where id = auth.uid()) = 'superadmin');

-- Programs: super admins see all; extension users see their own extension.
drop policy if exists "Users view teaching programs by scope" on public.teaching_programs;
create policy "Users view teaching programs by scope"
on public.teaching_programs
for select
to authenticated
using (
  (select role::text from public.profiles where id = auth.uid()) = 'superadmin'
  or extension_id = (select branch_id from public.profiles where id = auth.uid())
);

drop policy if exists "Admins and managers create teaching programs in scope" on public.teaching_programs;
create policy "Admins and managers create teaching programs in scope"
on public.teaching_programs
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    (select role::text from public.profiles where id = auth.uid()) = 'superadmin'
    or (
      (select role::text from public.profiles where id = auth.uid()) in ('admin', 'department_manager')
      and extension_id = (select branch_id from public.profiles where id = auth.uid())
    )
  )
);

drop policy if exists "Admins and managers update teaching programs in scope" on public.teaching_programs;
create policy "Admins and managers update teaching programs in scope"
on public.teaching_programs
for update
to authenticated
using (
  (select role::text from public.profiles where id = auth.uid()) = 'superadmin'
  or (
    (select role::text from public.profiles where id = auth.uid()) in ('admin', 'department_manager')
    and extension_id = (select branch_id from public.profiles where id = auth.uid())
  )
)
with check (
  (select role::text from public.profiles where id = auth.uid()) = 'superadmin'
  or (
    (select role::text from public.profiles where id = auth.uid()) in ('admin', 'department_manager')
    and extension_id = (select branch_id from public.profiles where id = auth.uid())
  )
);

drop policy if exists "Admins and managers delete teaching programs in scope" on public.teaching_programs;
create policy "Admins and managers delete teaching programs in scope"
on public.teaching_programs
for delete
to authenticated
using (
  (select role::text from public.profiles where id = auth.uid()) = 'superadmin'
  or (
    (select role::text from public.profiles where id = auth.uid()) in ('admin', 'department_manager')
    and extension_id = (select branch_id from public.profiles where id = auth.uid())
  )
);

-- Sessions inherit access from their parent program.
drop policy if exists "Users view teaching program sessions by parent scope" on public.teaching_program_sessions;
create policy "Users view teaching program sessions by parent scope"
on public.teaching_program_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.teaching_programs tp
    where tp.id = teaching_program_sessions.program_id
      and (
        (select role::text from public.profiles where id = auth.uid()) = 'superadmin'
        or tp.extension_id = (select branch_id from public.profiles where id = auth.uid())
      )
  )
);

drop policy if exists "Admins and managers insert teaching program sessions by parent scope" on public.teaching_program_sessions;
create policy "Admins and managers insert teaching program sessions by parent scope"
on public.teaching_program_sessions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.teaching_programs tp
    where tp.id = teaching_program_sessions.program_id
      and (
        (select role::text from public.profiles where id = auth.uid()) = 'superadmin'
        or (
          (select role::text from public.profiles where id = auth.uid()) in ('admin', 'department_manager')
          and tp.extension_id = (select branch_id from public.profiles where id = auth.uid())
        )
      )
  )
);

drop policy if exists "Admins and managers update teaching program sessions by parent scope" on public.teaching_program_sessions;
create policy "Admins and managers update teaching program sessions by parent scope"
on public.teaching_program_sessions
for update
to authenticated
using (
  exists (
    select 1
    from public.teaching_programs tp
    where tp.id = teaching_program_sessions.program_id
      and (
        (select role::text from public.profiles where id = auth.uid()) = 'superadmin'
        or (
          (select role::text from public.profiles where id = auth.uid()) in ('admin', 'department_manager')
          and tp.extension_id = (select branch_id from public.profiles where id = auth.uid())
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.teaching_programs tp
    where tp.id = teaching_program_sessions.program_id
      and (
        (select role::text from public.profiles where id = auth.uid()) = 'superadmin'
        or (
          (select role::text from public.profiles where id = auth.uid()) in ('admin', 'department_manager')
          and tp.extension_id = (select branch_id from public.profiles where id = auth.uid())
        )
      )
  )
);

drop policy if exists "Admins and managers delete teaching program sessions by parent scope" on public.teaching_program_sessions;
create policy "Admins and managers delete teaching program sessions by parent scope"
on public.teaching_program_sessions
for delete
to authenticated
using (
  exists (
    select 1
    from public.teaching_programs tp
    where tp.id = teaching_program_sessions.program_id
      and (
        (select role::text from public.profiles where id = auth.uid()) = 'superadmin'
        or (
          (select role::text from public.profiles where id = auth.uid()) in ('admin', 'department_manager')
          and tp.extension_id = (select branch_id from public.profiles where id = auth.uid())
        )
      )
  )
);
