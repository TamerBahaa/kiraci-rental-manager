-- ════════════════════════════════════════════════
-- Kiracı — Attachments Migration
-- Run all of this in one go in Supabase → SQL Editor
-- ════════════════════════════════════════════════

-- ── 1. ATTACHMENTS TABLE ─────────────────────────────────────────────────────
create table if not exists attachments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  entity_type text not null check (entity_type in ('contract', 'tenant', 'owner')),
  entity_id   uuid not null,
  file_name   text not null,
  file_path   text not null,
  file_size   integer not null,
  mime_type   text,
  created_at  timestamptz default now()
);

alter table attachments enable row level security;

drop policy if exists attachments_policy on attachments;
create policy attachments_policy on attachments
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_attachments_entity on attachments(entity_type, entity_id);

-- ── 2. STORAGE BUCKET (private, 2 MB limit) ──────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
  values ('kiraci-attachments', 'kiraci-attachments', false, 2097152)
  on conflict (id) do nothing;

-- ── 3. STORAGE POLICIES ───────────────────────────────────────────────────────
-- Files are stored as: {user_id}/{entity_type}/{entity_id}/{filename}
-- First folder segment = user_id → enforces per-user access

drop policy if exists kiraci_att_insert on storage.objects;
create policy kiraci_att_insert on storage.objects
  for insert with check (
    bucket_id = 'kiraci-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists kiraci_att_select on storage.objects;
create policy kiraci_att_select on storage.objects
  for select using (
    bucket_id = 'kiraci-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists kiraci_att_delete on storage.objects;
create policy kiraci_att_delete on storage.objects
  for delete using (
    bucket_id = 'kiraci-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
