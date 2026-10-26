-- Run this once in the Supabase SQL editor.
-- Then create a private Storage bucket named "receipts".

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  email text not null default '',
  role text not null default 'client' check (role in ('client', 'admin', 'super')),
  suspended boolean not null default false,
  kyc_status text not null default 'not_started',
  kyc jsonb,
  settings jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  account_id text not null,
  name text not null,
  category text not null,
  amount numeric not null,
  date date not null,
  status text,
  method text,
  receipt_name text,
  receipt_path text,
  receipt_sent boolean not null default false
);

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super')
  );
$$;

drop policy if exists "read own or staff profile" on public.profiles;
create policy "read own or staff profile" on public.profiles
  for select using (auth.uid() = id or public.is_staff());

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "update own or staff profile" on public.profiles;
create policy "update own or staff profile" on public.profiles
  for update using (auth.uid() = id or public.is_staff());

drop policy if exists "read own or staff transactions" on public.transactions;
create policy "read own or staff transactions" on public.transactions
  for select using (auth.uid() = user_id or public.is_staff());

drop policy if exists "insert own transactions" on public.transactions;
create policy "insert own transactions" on public.transactions
  for insert with check (auth.uid() = user_id or public.is_staff());

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not exists (
       select 1 from public.profiles where id = auth.uid() and role = 'super'
     ) then
    raise exception 'Only a super admin can change a role';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

drop policy if exists "update own or staff transactions" on public.transactions;
create policy "update own or staff transactions" on public.transactions
  for update using (auth.uid() = user_id or public.is_staff());

drop policy if exists "delete own or staff transactions" on public.transactions;
create policy "delete own or staff transactions" on public.transactions
  for delete using (auth.uid() = user_id or public.is_staff());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage policies. Create the private "receipts" bucket in the dashboard first.
drop policy if exists "read own or staff receipts" on storage.objects;
create policy "read own or staff receipts" on storage.objects
  for select using (
    bucket_id = 'receipts'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_staff())
  );

drop policy if exists "upload own receipts" on storage.objects;
create policy "upload own receipts" on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "update own receipts" on storage.objects;
create policy "update own receipts" on storage.objects
  for update using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Private "kyc" bucket. Create it in Storage before running this section.
drop policy if exists "read own or staff kyc" on storage.objects;
create policy "read own or staff kyc" on storage.objects
  for select using (
    bucket_id = 'kyc'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_staff())
  );

drop policy if exists "upload own kyc" on storage.objects;
create policy "upload own kyc" on storage.objects
  for insert with check (
    bucket_id = 'kyc'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "update own kyc" on storage.objects;
create policy "update own kyc" on storage.objects
  for update using (
    bucket_id = 'kyc'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
