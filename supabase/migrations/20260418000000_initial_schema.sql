create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_is_demo_idx on public.profiles (is_demo);

create table if not exists public.garments (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  image_url text not null,
  name text not null,
  category text not null default '',
  subcategory text not null,
  color text not null default '',
  season text not null default '',
  brand text not null default '',
  notes text not null default '',
  source text not null default 'manual_import',
  classification_source text not null default 'rule',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists garments_user_created_at_idx
  on public.garments (user_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'garment-images'
  ) then
    insert into storage.buckets (id, name, public)
    values ('garment-images', 'garment-images', false);
  end if;
end $$;
