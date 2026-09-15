# WebCo. — Ruang Briefing Pembuatan Website

Sistem informasi dossier 8 bab untuk calon customer yang memesan sistem berbasis web.
Stack: **SvelteKit + Vite + Neon Postgres** (Drizzle ORM + `@neondatabase/serverless`).

## Jalankan lokal

```bash
npm install
# .env sudah berisi DATABASE_URL Neon — jangan commit file ini
# Tambahkan juga baris berikut agar berkas klien masuk ke Cloudinary:
# CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
npm run db:migrate
npm run dev
```

Buka `http://localhost:5173` → **Mulai isi briefing** → `/brief`.
Ruang admin terpisah: `/admin` (wajib login kata kunci di `/admin/login`,
diatur via `ADMIN_PASSWORD` di `.env`; keluar via `/admin/keluar`).
Dashboard: statistik status, cari perusahaan/kontak/tiket, saring status,
baca per bab, ubah status, balas email/WA, hapus dossier + berkas.
Kolom **Berkas** di tabel menampilkan thumbnail logo + jumlah berkas yang terlampir
(sebutan slotnya ada di tooltip, mis. “logo, katalog, 3 logo klien”), dan menandai
“belum ada” bila klien tidak melampirkan apa pun — jadi kelengkapan terlihat tanpa
dibuka.

## Struktur

- `src/routes/+page.svelte` — landing dossier (tanpa metrics/gimmick)
- `src/routes/brief/` — wizard 8 bab + `?/kirim` (multipart; berkas dikirim langsung ke Cloudinary/Blob bila kredensial tersedia)
- `src/routes/brief/sukses/` — halaman tiket
- `src/routes/admin/` — tabel masuk + detail per bab + ubah status
- `src/routes/api/berkas/` — tanda tangan unggah langsung ke Cloudinary; token Vercel Blob (`handleUpload`) sebagai cadangan
- `src/routes/uploads/[...jalur]/` — menyajikan berkas yang tersimpan di Neon
- `src/routes/api/cron/bersihkan-berkas/` — pemicu harian pembersih berkas yatim (`vercel.json`)
- `src/lib/brief/` — metadata bab, validasi per bab, daftar slot berkas (`berkas.ts`), pengunggah browser (`unggah.ts`)
- `src/lib/pratinjau.ts` — tautan mini, ringkasan berkas, ukuran terbaca, jenis berkas
- `src/lib/components/PratinjauBerkas.svelte` — pratinjau di panel admin (detail + daftar dossier)
- `src/lib/components/PratinjauLampiran.svelte` — pratinjau berkas yang dipilih pengirim di `/brief`
- `src/lib/server/` — penyimpanan berkas (`storage.ts`), Cloudinary (`cloudinary.ts`), pembersih berkas yatim (`berkas-yatim.ts`), koneksi & skema Drizzle
- `drizzle/*.sql` — DDL Neon (`brief_submissions`, `brief_files`)
- `vercel.json` — jadwal cron harian pembersih berkas yatim
- `PRODUCT.md`, `DESIGN.md` — kontrak produk & visual (anti AI-slop)

## Berkas unggahan

Wadah utama adalah **Cloudinary** — gambar (PNG/SVG/WebP/JPG) dan PDF katalog, portofolio,
legalitas, logo klien, serta foto tim klien. Aktif sendiri begitu `CLOUDINARY_URL` ada:

```
# cloudinary://<api_key>:<api_secret>@<cloud_name>
CLOUDINARY_URL=cloudinary://123456789012345:rahasia@nama-akun
```

Setel di `.env` untuk lokal dan di Vercel → Settings → Environment Variables untuk produksi
(boleh juga dipisah: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
Berkas disimpan di `webco/uploads/<grup>/`, satu grup per pengiriman, dan dihapus mengikuti
tiket saat admin menghapus dossier.

Alurnya: browser minta tanda tangan ke `/api/berkas`, lalu mengunggah berkasnya **langsung ke
Cloudinary** sehingga tidak kena batas body request 4,5MB milik Vercel Functions (katalog PDF
sampai 10MB tetap lewat). Nama folder, `public_id`, dan daftar format yang diizinkan ditentukan
server dan ikut ditandatangani, jadi pengirim tidak bisa menaruh berkas di luar folder kita.

Empat lapis, dipakai berurutan supaya berkas tidak pernah hilang diam-diam:

1. **Cloudinary** — wadah utama gambar & PDF (`CLOUDINARY_URL`).
2. **Vercel Blob** (cadangan) — aktif bila `BLOB_READ_WRITE_TOKEN` ada; berkas juga diunggah
   langsung dari browser.
3. **`static/uploads/<TIKET>/`** — saat dijalankan lokal tanpa Cloudinary/Blob.
4. **Neon (`brief_files`)** — jaring pengaman terakhir; berkas disajikan lewat
   `/uploads/<id>/<nama-berkas>`.

Bila tidak ada wadah mana pun, berkas ikut body request sehingga maksimal ~4MB per berkas;
UI memperingatkan lebih dulu dengan pesan yang menyebut cara memulihkan. Ukuran berkas yang
diunggah langsung dibaca ulang di server (header `content-length`) agar batas per slot tetap
berlaku walau klien memaksa mengunggah berkas besar. Tautan dari klien hanya diterima bila
berasal dari akun Cloudinary kita sendiri atau Blob kita — bukan tautan luar.

Berkas **SVG** selalu lewat formulir (disimpan server), bukan jalur bertanda tangan: begitu
`allowed_formats` memuat `svg`, Cloudinary menolaknya dengan "Raw file format svg not allowed".
Semua unggahan memakai endpoint `/image/upload` dengan `resource_type: image`, karena deteksi
`auto` mengira SVG (tanpa magic bytes) sebagai berkas mentah `/raw/upload` yang tak bisa
ditransformasi.

## Pratinjau berkas di panel admin

Halaman detail dossier menampilkan bingkai pratinjau di tiap bab berkas (logo, katalog,
portofolio, legalitas, logo klien, foto tim) plus nama berkas mono yang bisa dibuka ukuran
penuh. Tautan Cloudinary dikecilkan di URL lewat transformasi: `c_limit,w_…,f_auto,q_auto`
untuk gambar dan `pg_1` untuk halaman pertama PDF (di situ ekstensinya berubah jadi `.jpg`,
kalau tetap `.pdf` yang terkirim isi PDF-nya). SVG dibiarkan apa adanya agar tetap tajam dan
hemat kuota transformasi. Berkas dari lapis lain (Blob/Neon/`static/uploads`) ditampilkan apa
adanya, dan bila pratinjau tak mungkin dibuat, yang tampil cuma nama berkas + tautan buka —
tidak ada ikon gambar rusak. Logikanya ada di `src/lib/pratinjau.ts` (`jenisBerkas`,
`tautanMini`) dan dipakai komponen `PratinjauBerkas`.

## Pembersih berkas yatim

Berkas klien naik ke Cloudinary **sebelum** dossier dikirim. Kalau pengirim berhenti di tengah
jalan — memilih berkas lalu menutup tab — berkasnya tertinggal di wadah tanpa dirujuk dossier
mana pun. `src/lib/server/berkas-yatim.ts` menyapunya, dipicu harian lewat
`/api/cron/bersihkan-berkas` (`vercel.json`, jadwal `0 3 * * *` — 03.00 **UTC**, bukan waktu lokal).

Batas amannya sengaja pelit, karena pekerjaan ini menghapus:

1. hanya folder `webco/`, baik sumber daya `image` maupun `raw`;
2. public ID yang dirujuk baris `brief_submissions` mana pun **tidak pernah** dihapus, apa pun status dossiernya;
3. berkas yang lebih muda dari masa tenggang (`CLOUDINARY_YATIM_HARI`, default 7 hari) dibiarkan — jangan sampai dossier yang sedang diisi kehilangan lampirannya;
4. kalau daftar rujukan gagal dibaca (Neon mati), **tidak ada** yang dihapus;
5. paling banyak 200 berkas per jalan sebagai pengaman.

Prasyarat: `CRON_SECRET`. Vercel mengirimnya sendiri sebagai `Authorization: Bearer …` saat
menjalankan cron; tanpa variabel itu endpoint menjawab 503 supaya tidak ada orang luar yang
bisa memicunya. Untuk memeriksa lebih dulu (tidak menghapus apa pun) lalu menjalankannya:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:5173/api/cron/bersihkan-berkas?kering=1"
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:5173/api/cron/bersihkan-berkas"
```

`?hari=N` menimpa masa tenggang (0 = tanpa tenggang, khusus pemeriksaan), `?kering=1` hanya
melapor. Balasannya berupa laporan: `diperiksa`, `terpakai`, `yatim`, `dihapus`, `gagal`, dan
`contoh` public ID — dibaca juga di log fungsi (`[webco] pembersih berkas yatim: …`).

## Pratinjau sebelum kirim (sisi pengirim)

Begitu berkas dipilih di `/brief`, pengirim langsung melihat kartu pratinjau di bawah
kolomnya: thumbnail gambar, penanda **PDF** untuk dokumen, nama berkas (mono), ukuran, dan
tautan “lihat” yang membuka berkas di tab baru — penampil PDF bawaan browser dipakai untuk
memeriksa dokumen sebelum dikirim.

Caranya: berkas lokal ditampilkan seketika lewat object URL, lalu setelah naik ke wadah
tautannya diganti URL Cloudinary (thumbnail ikut dikecilkan secara otomatis). Berkas yang
memang dikirim bersama formulir — semua SVG, atau kondisi tanpa wadah — tetap dipratinjau
dari perangkat pengirim dan ditandai “dikirim bersama formulir”. Object URL dilepas
(`revokeObjectURL`) saat berkas diganti atau halaman ditinggalkan supaya memori browser tidak
menumpuk. Berkas yang ditolak validasi tidak dipratinjau, supaya tidak terkesan akan terkirim.
Langkah terakhir (“Periksa ringkasan dossier”) menampilkan ulang semua lampiran beserta
nama dan ukurannya, jadi pengirim bisa memastikan berkas yang benar sebelum menekan Kirim.

## Aturan desain (ringkas)

Kertas arsip `#F4F1E8`, tinta dongker `#1C2A3A`, kuningan `#7A5E14`.
Font Plus Jakarta Sans + JetBrains Mono (data). Tanpa gradient/glass/halo/marquee,
maks 1 level kartu, body 16px/1.5 maks 68ch, kontras AA.

