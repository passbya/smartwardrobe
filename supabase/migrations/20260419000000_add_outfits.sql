create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  generated_name text not null,
  name_source text not null default 'generated' check (name_source in ('generated', 'manual')),
  top_garment_id uuid null,
  bottom_garment_id uuid null,
  dress_garment_id uuid null,
  outerwear_garment_id uuid null,
  shoes_garment_id uuid null,
  accessory_garment_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outfits_user_updated_at_idx
  on public.outfits (user_id, updated_at desc);
