# WebCo. — Ruang Briefing Pembuatan Website

Sistem informasi dossier 8 bab untuk calon customer yang memesan sistem berbasis web.
Stack: **SvelteKit + Vite + Neon Postgres** (Drizzle ORM + `@neondatabase/serverless`).

## Jalankan lokal

```bash
npm install
# .env sudah berisi DATABASE_URL Neon — jangan commit file ini
npm run db:migrate
npm run dev
```

Buka `http://localhost:5173` → **Mulai isi briefing** → `/brief`.
Ruang admin terpisah: `/admin` (wajib login kata kunci di `/admin/login`,
diatur via `ADMIN_PASSWORD` di `.env`; keluar via `/admin/keluar`).
Dashboard: statistik status, cari perusahaan/kontak/tiket, saring status,
baca per bab, ubah status, balas email/WA, hapus dossier + berkas.

## Struktur

- `src/routes/+page.svelte` — landing dossier (tanpa metrics/gimmick)
- `src/routes/brief/` — wizard 8 bab + `?/kirim` (multipart; berkas dikirim langsung ke Vercel Blob bila token tersedia)
- `src/routes/brief/sukses/` — halaman tiket
- `src/routes/admin/` — tabel masuk + detail per bab + ubah status
- `src/routes/api/berkas/` — token unggah langsung ke Vercel Blob (`handleUpload`)
- `src/routes/uploads/[...jalur]/` — menyajikan berkas yang tersimpan di Neon
- `src/lib/brief/` — metadata bab, validasi per bab, daftar slot berkas (`berkas.ts`)
- `src/lib/server/` — penyimpanan berkas (`storage.ts`), koneksi & skema Drizzle
- `drizzle/*.sql` — DDL Neon (`brief_submissions`, `brief_files`)
- `PRODUCT.md`, `DESIGN.md` — kontrak produk & visual (anti AI-slop)

## Berkas unggahan

Tiga lapis, dipakai berurutan supaya berkas tidak pernah hilang diam-diam:

1. **Vercel Blob** — aktif sendiri begitu `BLOB_READ_WRITE_TOKEN` ada (hubungkan Blob store
   di dashboard Vercel → Environment Variables → Redeploy). Berkas diunggah **langsung dari
   browser**, jadi tidak kena batas body request 4,5MB milik Vercel Functions.
2. **`static/uploads/<TIKET>/`** — saat dijalankan lokal tanpa token Blob.
3. **Neon (`brief_files`)** — jaring pengaman saat Blob belum aktif di produksi; berkas
   disajikan lewat `/uploads/<id>/<nama-berkas>`.

Bila tidak ada Blob di Vercel, berkas ikut body request sehingga maksimal ~4MB per berkas;
UI memperingatkan lebih dulu dengan pesan yang menyebut cara memulihkan.

## Aturan desain (ringkas)

Kertas arsip `#F4F1E8`, tinta dongker `#1C2A3A`, kuningan `#7A5E14`.
Font Plus Jakarta Sans + JetBrains Mono (data). Tanpa gradient/glass/halo/marquee,
maks 1 level kartu, body 16px/1.5 maks 68ch, kontras AA.

