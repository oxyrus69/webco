# Design — WebCo. Ruang Briefing

Mode: Operate (tugas: menyelesaikan dossier 8 bab). Persuade hanya di landing ringkas sebagai pintu masuk.

## Thesis

Ruang briefing dossier bengkel: dokumen bernomor bab dengan navigator ordner di kiri, bukan landing SaaS generik. Menolak hero+metrics+grid fitur; pembuka adalah meja kerja yang menunjukkan dokumen, posisi, dan aksi kirim.

## Palette (solid, tanpa gradient/glass/halo)

- Kertas kerja: `#FFFFFF` (permukaan utama)
- Kertas arsip: `#F4F1E8` — alasan: kertas dossier bengkel, bukan krem dekoratif; hanya untuk latar workspace, bukan seluruh halaman. /* intentional: kertas arsip sebagai metafora ordner briefing */
- Tinta dongker: `#1C2A3A` (teks utama, header, tombol primer). Kontras di atas putih ±13:1, di atas kertas arsip ±11:1.
- Tinta redup: `#3D4D61` (teks sekunder, tint dari hue tinta — bukan abu netral washout). Kontras di atas putih ±7:1.
- Kuningan arsip: `#7A5E14` (aksen teks/garis aktif, nomor bab aktif). Kontras di atas putih ±5.9:1, lolos AA untuk teks biasa. Jangan pakai kuning terang di atas gelap.
- Latar tinta: `#1C2A3A` dengan teks `#FFFFFF` dan sekunder `#D8DFE8` (tint terang dari hue tinta, kontras ±11:1).
- Bata: `#A63A22` (wajib/error, garis tebal status). Teks bata di atas putih ±6:1.
- Lumut: `#2E6B4E` (sukses/valid). Teks di atas putih ±5.4:1.
- Garis: `#DDD6C4` (hairline 1px, tanpa shadow ganda — pilih edge ATAU shadow, di sini edge).

Larangan: tanpa purple-to-blue gradient, tanpa gradient text, tanpa glow/neon, tanpa spotlight/radial halo, tanpa stripes/noise, tanpa grid dekoratif.

## Typography

Alasan di luar daftar default: memakai satu keluarga variabel berporos lebar agar header dossier bisa padat-tegas dan body tetap netral dalam satu sistem — menghindari campur serif editorial generik.

- Display + Body + Label: `Plus Jakarta Sans` 400–800 (keputusan 2026-09-12 dari critique `src-app-css`; menggantikan Archivo sebagai font standar perusahaan). Tanpa width axis: display memakai bobot 800 + tracking −0.02em. Google Fonts `display=swap`. Fallback: system-ui.
- Mono data: `JetBrains Mono` 400/500 — HANYA untuk nomor bab, nomor tiket, nama/ukuran berkas, kode. Prosa (sub-navigator, progres, draf, th tabel, lencana, meta unggah) memakai sans.
- Skala: H1 30–42px/1.12 weight 800 tracking −0.02em maks 22ch; H2 bab 22px/1.25 weight 700; H3 grup 16px/1.4 weight 700; Body 16px/1.5; UI kecil min 13px (meta berkas/kode boleh 12px mono); tracking floor −0.04em.
- Error 14px/700 bata + penanda `!` + kotak ringkasan ber-link ke kolom; help 13–14px regular — tidak boleh identik.
- Aturan: tanpa label kecil pengulang di atas heading; tanpa badge pill di atas H1; tanpa italic serif raksasa; H1 pendek (maks 2 baris); body max-width 68ch, align start, sentence case; tanpa inline `style="font-*"` di routes (gunakan kelas token).

## Bentuk & Kedalaman

- Radius: input 6px, tombol 8px, kartu 10px, lembar dossier 12px. Tanpa blob 24–44px pada kartu kecil.
- Edge ATAU shadow, tidak dua-duanya: kartu memakai hairline 1px `#DDD6C4` tanpa shadow; lembar aktif memakai shadow lembut `0 12px 32px rgb(28 42 58 / 0.10)` dengan offset+blur tanpa hairline.
- Kartu maks 1 level. Tanpa side-tab stripe, tanpa border accent tebal di kartu rounded.
- Ikon: Lucide inline SVG, stroke 1.75, satu bobot konsisten. Tanpa emoji sebagai ikon, tanpa tile ikon raksasa.

## Layout

- Landing: dua kolom tak seimbang yang disengaja lalu direbalance — kiri: H1 pendek + 3 langkah bernomor berurutan (isi → kirim → dihubungi) + CTA primer "Mulai isi briefing" + sekunder "Lihat contoh dossier"; kanan: miniatur lembar dossier 8 bab (daftar bernomor dengan status contoh, bukan mockup palsu). Tanpa metrics raksasa, tanpa grid 6 kartu.
- /brief: workspace dua kolom — kiri sticky navigator 8 bab (nomor mono + nama + status centang, vertikal di desktop, progress bar horizontal di HP); kanan lembar formulir satu bab per layar dengan tombol Kembali/Lanjut, validasi per bab, simpan draf otomatis. Heading space-atas > space-bawah. Grup berelasi didekatkan, antar-grup direnggangkan.
- /admin: tabel ringkas (tiket, perusahaan, kontak, status, tanggal) + halaman detail per bab dengan blok file unduhan.
- Padding viewport horizontal wajib; tanpa scroll horizontal; kartu tidak flush ke tepi scroller.

## Motion

Satu momen authored: transisi bab (geser 8px + fade 160ms, ease-out eksponensial, dari default visible). Tanpa pulse dot, tanpa marquee, tanpa cursor palsu, tanpa bounce/elastic, tanpa zoom gambar massal. Konten visible tanpa JS; animasi hanya transform/opacity.

## Browser surfaces

Selection tinta di atas kuningan muda `#F2E6B8`; caret tinta; focus ring 2px `#7A5E14` offset 2px; scrollbar tipis hue tinta; underline offset 3px; angka tabular untuk tahun/telepon/tiket.

## Checklist ship

Lihat AGENTS.md Bagian 10. Tambahan: `npm run build` bersih, cek desktop 1280 + mobile 390 bersamaan, heading order benar, semua upload ada pesan error pemulihan, draf localStorage bertahan saat refresh.
