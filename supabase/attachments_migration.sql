-- ════════════════════════════════════════════════
-- Kiracı — Attachments Migration
-- Run this in: Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════

-- ── ATTACHMENTS TABLE ────────────────────────────────────────────────────────
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

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'attachments_policy') then
    create policy attachments_policy on attachments
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_attachments_entity on attachments(entity_type, entity_id);

-- ── STORAGE BUCKET ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'kiraci-attachments',
    'kiraci-attachments',
    false,
    2097152,  -- 2 MB
    array['application/pdf','application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg','image/png','image/webp','image/gif']
  )
  on conflict (id) do nothing;

-- ── STORAGE RLS POLICIES ─────────────────────────────────────────────────────
-- Path pattern: {user_id}/{entity_type}/{entity_id}/{filename}
-- First segment = user_id — used to enforce per-user access

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'kiraci_att_insert'
  ) then
    create policy kiraci_att_insert on storage.objects
      for insert with check (
        bucket_id = 'kiraci-attachments'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'kiraci_att_select'
  ) then
    create policy kiraci_att_select on storage.objects
      for select using (
        bucket_id = 'kiraci-attachments'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'kiraci_att_delete'
  ) then
    create policy kiraci_att_delete on storage.objects
      for delete using (
        bucket_id = 'kiraci-attachments'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;
