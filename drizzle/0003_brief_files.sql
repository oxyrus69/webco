-- Berkas unggahan dossier — dipakai saat Vercel Blob belum dikonfigurasi
-- (termasuk saat dijalankan lokal), agar logo & katalog tetap sampai ke admin.
create table if not exists brief_files (
  id uuid primary key default gen_random_uuid(),
  ticket text not null,
  nama text not null,
  tipe text,
  ukuran integer not null,
  isi bytea not null,
  created_at timestamptz not null default now()
);

create index if not exists brief_files_ticket_idx on brief_files (ticket);
