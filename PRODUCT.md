# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

SvelteKit + Vite + Neon Postgres (postgresql://neondb_owner:...@ep-holy-leaf-b395lcau-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb). ORM: Drizzle + @neondatabase/serverless. Upload file: filesystem `static/uploads` (logo PNG/vector, katalog PDF, logo klien, foto tim, legalitas). Bahasa UI: Bahasa Indonesia.

## Users

Calon customer perusahaan (pemilik, manajer, staf marketing/IT) yang ingin memesan pembuatan sistem berbasis web. Situasi: mengisi dokumen briefing lengkap 8 bagian dalam 1 sesi 15-25 menit, sering dari HP maupun desktop kantor. Job: menyampaikan kontak, identitas perusahaan, profil, produk, portofolio, tim/legalitas, sosmed, dan preferensi desain/fitur agar tim WebCo. bisa memberi penawaran akurat tanpa bolak-balik chat.

Admin/internal WebCo. (tim developer/desainer) yang membaca hasil briefing, menilai kelengkapan, menghubungi klien.

## Product Purpose

WebCo. adalah ruang briefing terstruktur untuk pemesanan website. Menggantikan formulir bebas/chat berantakan dengan dossier 8 bab yang memandu klien dari kontak hingga preferensi desain, menyimpan ke Postgres, dan memberi admin daftar submission yang bisa ditindaklanjuti. Sukses = klien menyelesaikan 8 bagian tanpa bingung, data tersimpan utuh termasuk file, admin bisa membaca ulang dalam 2 menit dan menghubungi kembali.

## Positioning

Bukan template company-profile generator. WebCo. adalah meja kerja briefing: satu dokumen bernomor bab (01-08), navigator lengkung kiri yang menunjukkan posisi, validasi per bab, dan ringkasan sebelum kirim. Pesaing memakai Google Form panjang; WebCo. memakai alur dossier yang bisa dijeda, dilengkapi contoh isian per kolom.

## Operating Context

Alur: landing singkat → /brief (wizard 8 langkah, simpan draf di localStorage, submit multipart) → /brief/sukses (nomor tiket) → /admin (tabel + detail + unduh file + ubah status). File: logo (PNG/SVG/WebP, max 5MB), katalog PDF (max 10MB), logo klien & foto tim (gambar, max 5MB), portofolio/legalitas (PDF/gambar, max 10MB). Validasi: email format, telepon Indonesia longgar, tahun 1800-tahun berjalan, wajib per bab sebelum lanjut kecuali bab opsional (6 dan 7 sebagian).

## Capabilities and Constraints

Wajib: 8 bagian sesuai brief (kontak, identitas, profil, produk, portofolio, tim/legalitas opsional, sosmed, desain/fitur); pilihan gaya desain (Minimalis & Modern / Elegan & Mewah / Ceria & Penuh Warna / Korporat & Profesional / Lainnya); checkbox 6 fitur tambahan; upload 5 slot; tersimpan ke Neon tabel `brief_submissions`; halaman admin baca + ubah status; responsif HP/desktop; nol JS error; konten visible tanpa JS (progressive enhancement via form actions).

Belum diputuskan: auth admin (v1 tanpa login, via path /admin), notifikasi email/WA otomatis, multi-bahasa UI.

Istilah: Submission = satu dossier briefing; Bab = satu dari 8 bagian; Draf = isian tersimpan lokal sebelum kirim.

## Brand Commitments

Nama: WebCo. (dengan titik). Bahasa: Indonesia formal-ramah. Nada: bengkel yang rapi, bukan agensi hype. Tanpa klaim generik (supercharge/world-class). Contoh isian memakai perusahaan fiktif Indonesia yang jelas sintetis.

## Evidence on Hand

Brief 8 bagian dari user (sumber konten kolom). Tidak ada logo, testimoni nyata, atau data customer — semua contoh di UI wajib fiktif dan tidak diklaim sebagai portofolio WebCo.

## Product Principles

1. Satu dokumen, bukan 8 formulir lepas — navigator selalu menunjukkan bab aktif dan sisa.
2. Contoh mengalahkan penjelasan — tiap kolom panjang diberi contoh 1 kalimat.
3. Jangan minta ulang — draf lokal bertahan saat refresh; ringkasan akhir bisa dikoreksi per bab.
4. Admin membaca cepat — detail submission dikelompokkan per bab dengan status kelengkapan.
5. Jujur soal file — ukuran/tipe ditolak dengan pesan yang menyebut cara pulih, bukan kode error.

## Accessibility & Inclusion

Target WCAG AA: teks biasa ≥4.5:1, teks besar ≥3:1. Bahasa Indonesia, label terasosiasi, urutan heading h1→h2→h3, fokus keyboard terlihat, error diumumkan via aria-live. Body 16px, line-height 1.5.
