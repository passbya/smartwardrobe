alter table public.profiles
add column if not exists auth_user_id uuid;

create unique index if not exists profiles_auth_user_id_idx
  on public.profiles (auth_user_id)
  where auth_user_id is not null;

alter table public.profiles enable row level security;
alter table public.garments enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (
    auth.uid() is not null
    and auth_user_id = auth.uid()
  );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and auth_user_id = auth.uid()
    and is_demo = false
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (
    auth.uid() is not null
    and auth_user_id = auth.uid()
  )
  with check (
    auth.uid() is not null
    and auth_user_id = auth.uid()
  );

drop policy if exists "garments_select_own" on public.garments;
create policy "garments_select_own"
  on public.garments
  for select
  to authenticated
  using (
    auth.uid() is not null
    and exists (
      select 1
      from public.profiles
      where profiles.id = garments.user_id
        and profiles.auth_user_id = auth.uid()
    )
  );

drop policy if exists "garments_insert_own" on public.garments;
create policy "garments_insert_own"
  on public.garments
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and exists (
      select 1
      from public.profiles
      where profiles.id = garments.user_id
        and profiles.auth_user_id = auth.uid()
    )
  );

drop policy if exists "garments_update_own" on public.garments;
create policy "garments_update_own"
  on public.garments
  for update
  to authenticated
  using (
    auth.uid() is not null
    and exists (
      select 1
      from public.profiles
      where profiles.id = garments.user_id
        and profiles.auth_user_id = auth.uid()
    )
  )
  with check (
    auth.uid() is not null
    and exists (
      select 1
      from public.profiles
      where profiles.id = garments.user_id
        and profiles.auth_user_id = auth.uid()
    )
  );

drop policy if exists "garment_images_select_own" on storage.objects;
create policy "garment_images_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'garment-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "garment_images_insert_own" on storage.objects;
create policy "garment_images_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'garment-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "garment_images_update_own" on storage.objects;
create policy "garment_images_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'garment-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'garment-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
