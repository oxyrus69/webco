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
- `src/routes/brief/` — wizard 8 bab + `?/kirim` (multipart, simpan berkas ke `static/uploads/<TIKET>/`)
- `src/routes/brief/sukses/` — halaman tiket
- `src/routes/admin/` — tabel masuk + detail per bab + ubah status
- `src/lib/brief/` — metadata bab, validasi per bab
- `src/lib/server/db/` — skema Drizzle `brief_submissions`
- `drizzle/0001_brief_submissions.sql` — DDL Neon
- `PRODUCT.md`, `DESIGN.md` — kontrak produk & visual (anti AI-slop)

## Aturan desain (ringkas)

Kertas arsip `#F4F1E8`, tinta dongker `#1C2A3A`, kuningan `#7A5E14`.
Font Archivo + JetBrains Mono (data). Tanpa gradient/glass/halo/marquee,
maks 1 level kartu, body 16px/1.5 maks 68ch, kontras AA.
