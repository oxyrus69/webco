<script lang="ts">
	import { STEPS } from '$lib/brief/steps';
</script>

<svelte:head><title>Contoh dossier terisi — WebCo.</title></svelte:head>

<div class="workspace">
	<div class="wrap">
		<p class="crumb"><a href="/">Beranda</a> / Contoh dossier</p>
		<h1 class="judul-halaman" style="max-width: 24ch; text-wrap: balance">Contoh dossier yang terisi lengkap</h1>
		<p class="persetujuan" style="max-width: 68ch">
			Di bawah ini dossier fiktif milik <b>PT Maju Baja Abadi</b> — perusahaan bahan bangunan
			rekaan — yang diisi dari Bab 01 sampai 08 dengan lengkap. Seluruh nama, angka, dan tautan
			adalah contoh. Pakai sebagai contekan saat mengisi dossier Anda sendiri.
		</p>

		<ol class="nav-bab contoh-daftar" aria-label="Daftar isi contoh">
			{#each STEPS as s, i}
				<li><a href={`#contoh-${s.id}`}> <span class="no">{s.no}</span> {s.judul}</a></li>
			{/each}
		</ol>

		<div class="lembar">
			<section id="contoh-kontak" class="contoh-bab">
				<p class="no-bab">BAB 01 · INFORMASI KONTAK KLIEN</p>
				<h2>Informasi Kontak Klien</h2>
				<dl class="contoh-isi">
					<div><dt>Nama lengkap</dt><dd>Ratna Prameswari</dd></div>
					<div><dt>Jabatan</dt><dd>Marketing Manager</dd></div>
					<div><dt>Telepon / WhatsApp</dt><dd>0812-3456-7890</dd></div>
					<div><dt>Email</dt><dd>ratna@majubaja.id</dd></div>
				</dl>
			</section>

			<section id="contoh-identitas" class="contoh-bab">
				<p class="no-bab">BAB 02 · IDENTITAS DASAR PERUSAHAAN</p>
				<h2>Identitas Dasar Perusahaan</h2>
				<dl class="contoh-isi">
					<div><dt>Nama perusahaan</dt><dd>PT Maju Baja Abadi (MBA)</dd></div>
					<div><dt>Tagline</dt><dd>Atap kuat, hati tenang</dd></div>
					<div><dt>Tahun berdiri</dt><dd>2014</dd></div>
					<div><dt>Bidang</dt><dd>Konstruksi baja ringan dan bahan bangunan</dd></div>
					<div><dt>Kantor pusat</dt><dd>Jl. Merdeka No. 88, Bandung 40115</dd></div>
					<div><dt>Kantor cabang</dt><dd>Ruko Taman Palem Blok C-9, Jakarta Barat</dd></div>
					<div><dt>Telepon</dt><dd>(022) 420-8899</dd></div>
					<div><dt>Email resmi</dt><dd>halo@majubaja.id</dd></div>
					<div><dt>Logo</dt><dd>Diunggah: logo-mba-hires.png (PNG, 2,1 MB)</dd></div>
				</dl>
			</section>

			<section id="contoh-profil" class="contoh-bab">
				<p class="no-bab">BAB 03 · PROFIL &amp; LATAR BELAKANG</p>
				<h2>Profil &amp; Latar Belakang</h2>
				<dl class="contoh-isi">
					<div><dt>Sejarah</dt><dd>Berdiri 2014 di Bandung oleh dua insinyur sipil. Berawal dari toko bahan bangunan, kini melayani 300 kontraktor di Jawa Barat.</dd></div>
					<div><dt>Visi</dt><dd>Menjadi pemasok atap baja paling dipercaya di Jawa Barat.</dd></div>
					<div><dt>Misi</dt><dd>1) Menyediakan bahan bersertifikat. 2) Survei maksimal 24 jam. 3) Garansi tertulis setiap pekerjaan.</dd></div>
					<div><dt>Nilai inti</dt><dd>Jujur soal bahan. Tepat waktu. Garansi tertulis.</dd></div>
					<div><dt>Target market</dt><dd>B2B kontraktor dan B2C keluarga muda usia 25–40 tahun yang membangun rumah pertama.</dd></div>
				</dl>
			</section>

			<section id="contoh-produk" class="contoh-bab">
				<p class="no-bab">BAB 04 · PRODUK &amp; LAYANAN</p>
				<h2>Produk &amp; Layanan</h2>
				<dl class="contoh-isi">
					<div><dt>Produk utama</dt><dd>1) Atap baja ringan — garansi 10 tahun. 2) Jasa pasang — survei gratis Jabodetabek. 3) Kanopi aluminium custom.</dd></div>
					<div><dt>Keunggulan</dt><dd>Survei 24 jam dan garansi tertulis; kompetitor hanya memberi garansi lisan.</dd></div>
					<div><dt>Katalog</dt><dd>Diunggah: katalog-mba-2026.pdf (PDF, 4,8 MB)</dd></div>
				</dl>
			</section>

			<section id="contoh-portofolio" class="contoh-bab">
				<p class="no-bab">BAB 05 · PORTOFOLIO, KLIEN &amp; TESTIMONI</p>
				<h2>Portofolio, Klien &amp; Testimoni</h2>
				<dl class="contoh-isi">
					<div><dt>Klien utama</dt><dd>PT Waskita Beton, Dinas PU Kota Bandung, Hotel Amaris.</dd></div>
					<div><dt>Proyek unggulan</dt><dd>2023 — Atap GOR Soreang 4.200 m², selesai 45 hari, di bawah anggaran 3%.</dd></div>
					<div><dt>Testimoni</dt><dd>"Pengerjaan rapi dan tepat waktu." — H. Bambang, Direktur PT Waskita Beton.</dd></div>
				</dl>
			</section>

			<section id="contoh-tim" class="contoh-bab">
				<p class="no-bab">BAB 06 · TIM &amp; LEGALITAS</p>
				<h2>Tim &amp; Legalitas</h2>
				<dl class="contoh-isi">
					<div><dt>Tim utama</dt><dd>Ir. Dedi Kurnia — Direktur Utama. Sari Lestari — Kepala Operasional.</dd></div>
					<div><dt>Sertifikasi</dt><dd>ISO 9001:2015 (2022), SNI atap baja lembaran.</dd></div>
				</dl>
			</section>

			<section id="contoh-sosial" class="contoh-bab">
				<p class="no-bab">BAB 07 · TAUTAN &amp; SOSIAL MEDIA</p>
				<h2>Tautan &amp; Sosial Media</h2>
				<dl class="contoh-isi">
					<div><dt>Instagram</dt><dd>@majubaja (contoh)</dd></div>
					<div><dt>LinkedIn</dt><dd>PT Maju Baja Abadi (contoh)</dd></div>
					<div><dt>Facebook / X</dt><dd>— (tidak punya, dikosongkan)</dd></div>
					<div><dt>YouTube / TikTok</dt><dd>@majubaja (contoh)</dd></div>
				</dl>
			</section>

			<section id="contoh-desain" class="contoh-bab">
				<p class="no-bab">BAB 08 · DESAIN &amp; FITUR WEB</p>
				<h2>Desain &amp; Fitur Web</h2>
				<dl class="contoh-isi">
					<div><dt>Warna identitas</dt><dd>Biru dongker dan emas <span class="hex">#1C2A3A · #C49A3C</span></dd></div>
					<div><dt>Gaya desain</dt><dd>Korporat &amp; Profesional</dd></div>
					<div><dt>Referensi</dt><dd>1) Situs A — suka tata letak proyeknya yang besar dan jelas. 2) Situs B — suka halaman harganya yang transparan.</dd></div>
					<div><dt>Fitur</dt><dd>Formulir penawaran harga, tombol WhatsApp melayang, Google Maps, galeri foto proyek.</dd></div>
					<div><dt>Catatan</dt><dd>Deadline tayang sebelum pameran 20 Desember. Admin website cukup 1 orang.</dd></div>
				</dl>
			</section>
		</div>

		<div class="aksi" style="margin-top: 24px">
			<a class="btn btn-primer" href="/brief">Isi dossier saya sekarang</a>
			<a class="btn btn-kedua" href="/">Kembali ke beranda</a>
		</div>
	</div>
</div>
