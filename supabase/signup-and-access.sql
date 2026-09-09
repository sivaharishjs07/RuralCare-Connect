-- Run this once in Supabase SQL Editor.
-- It creates a patient profile and patient record for every public signup.

create unique index if not exists patients_profile_id_unique
on public.patients (profile_id)
where profile_id is not null;

create or replace function public.handle_new_patient_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    'patient',
    coalesce(nullif(new.raw_user_meta_data->>'language', ''), 'en')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    role = 'patient',
    language = excluded.language;

  insert into public.patients (profile_id, full_name, phone, date_of_birth, gender, address, district, region, emergency_contact, emergency_contact_name, emergency_contact_phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'date_of_birth', '')::date,
    nullif(new.raw_user_meta_data->>'gender', '')::text,
    nullif(new.raw_user_meta_data->>'address', ''),
    nullif(new.raw_user_meta_data->>'district', ''),
    nullif(new.raw_user_meta_data->>'region', ''),
    null,
    nullif(new.raw_user_meta_data->>'emergency_contact_name', ''),
    nullif(new.raw_user_meta_data->>'emergency_contact_phone', '')
  )
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_patient_user();

-- Role lookup used by row-level security policies.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.patients enable row level security;

-- Remove only policies with these names so this script can be safely rerun.
drop policy if exists profiles_select_own_or_staff on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_insert_own_patient on public.profiles;
drop policy if exists patients_select_scoped on public.patients;
drop policy if exists patients_insert_own on public.patients;
drop policy if exists patients_update_scoped on public.patients;

create policy profiles_select_own_or_staff on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or public.current_app_role() in ('admin', 'doctor', 'health_worker')
);

create policy profiles_insert_own_patient on public.profiles
for insert to authenticated
with check (id = auth.uid() and role = 'patient');

create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid() or public.current_app_role() = 'admin')
with check (id = auth.uid() and role = 'patient' or public.current_app_role() = 'admin');

create policy patients_select_scoped on public.patients
for select to authenticated
using (
  profile_id = auth.uid()
  or public.current_app_role() in ('admin', 'doctor')
  or (public.current_app_role() = 'health_worker' and assigned_health_worker_id = auth.uid())
);

create policy patients_insert_own on public.patients
for insert to authenticated
with check (profile_id = auth.uid() or public.current_app_role() in ('admin', 'doctor', 'health_worker'));

create policy patients_update_scoped on public.patients
for update to authenticated
using (
  profile_id = auth.uid()
  or public.current_app_role() = 'admin'
  or (public.current_app_role() = 'health_worker' and assigned_health_worker_id = auth.uid())
  or public.current_app_role() = 'doctor'
)
with check (
  profile_id = auth.uid()
  or public.current_app_role() in ('admin', 'doctor')
  or (public.current_app_role() = 'health_worker' and assigned_health_worker_id = auth.uid())
);
