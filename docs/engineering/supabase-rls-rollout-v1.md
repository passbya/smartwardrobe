# Supabase RLS Rollout v1

## Goal

Add a minimum RLS and Storage policy baseline without breaking the current
server-side `service_role` integration.

## Scope

- Enable RLS on `public.profiles`
- Enable RLS on `public.garments`
- Add `profiles.auth_user_id` as the future bridge to `auth.uid()`
- Add authenticated-user policies for profile, garment, and storage access

## Non-goals

- Replace the current demo-session flow with Supabase Auth
- Remove or weaken server-side `service_role` access
- Add destructive delete policies for garments or storage objects

## Migration

Run this migration after the initial schema migration:

- [20260418110000_enable_rls_and_storage_policies.sql](D:\whtFIle\codexProj\smartwardrobe\supabase\migrations\20260418110000_enable_rls_and_storage_policies.sql)

## Important behavior

- Current production code still uses `SUPABASE_SERVICE_ROLE_KEY` on the server.
- Per Supabase behavior, `service_role` bypasses RLS.
- `storage.objects` is managed by Supabase. Do not run `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY`; create bucket-scoped policies only.
- That means this rollout is a security baseline for future authenticated
  browser access, while remaining non-breaking for the current MVP.

## Rollout steps

1. Apply the initial schema migration.
2. Apply the RLS migration.
3. Restart the local or deployed app process.
4. Confirm `/api/runtime` still reports `repositoryMode: "supabase"`.
5. Run the smoke flow again.

## Follow-up

- When real Supabase Auth is introduced, create or sync `profiles.auth_user_id`
  from the authenticated user id.
- If browser-direct uploads are added later, write files under a first path
  segment equal to `auth.uid()`.
