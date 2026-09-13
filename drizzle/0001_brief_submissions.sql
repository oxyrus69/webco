-- WebCo. briefing dossier — tabel utama
create extension if not exists "pgcrypto";

create table if not exists brief_submissions (
  id uuid primary key default gen_random_uuid(),
  ticket text not null unique,
  status text not null default 'baru',
  created_at timestamptz not null default now(),

  kontak_nama text not null,
  kontak_jabatan text not null,
  kontak_wa text not null,
  kontak_email text not null,

  nama_resmi text not null,
  singkatan text,
  tagline text,
  tahun_berdiri integer,
  bidang text not null,
  alamat_pusat text not null,
  alamat_cabang text,
  telepon_perusahaan text,
  email_perusahaan text,
  logo_url text,

  sejarah text,
  visi text,
  misi text,
  core_values text,
  target_market text,

  daftar_produk text,
  usp text,
  katalog_url text,

  klien_daftar text,
  logo_klien_urls jsonb not null default '[]',
  portofolio_desc text,
  portofolio_file_url text,
  testimoni text,

  anggota_tim text,
  foto_tim_urls jsonb not null default '[]',
  legalitas_desc text,
  legalitas_file_url text,

  instagram text,
  linkedin text,
  facebook_x text,
  youtube_tiktok text,

  warna_identitas text,
  gaya_desain text,
  gaya_lainnya text,
  referensi text,
  fitur jsonb not null default '[]',
  catatan text
);

create index if not exists idx_brief_created on brief_submissions (created_at desc);
create index if not exists idx_brief_status on brief_submissions (status);
