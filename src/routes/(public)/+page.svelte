<script lang="ts">
	import { STEPS } from '$lib/brief/steps';

	const ringkas: Record<string, string> = {
		kontak: 'Kontak yang bisa dihubungi',
		identitas: 'Data perusahaan',
		profil: 'Cerita usaha',
		produk: 'Produk & jasa',
		portofolio: 'Contoh pekerjaan',
		tim: 'Tim & legalitas',
		sosial: 'Sosial media',
		desain: 'Tampilan & fitur'
	};
</script>

<section class="wrap pembuka">
	<div class="pembuka-kiri">
		<p class="eyebrow">WebCo. · Jasa pembuatan website &amp; aplikasi</p>
		<h1>Pesan website atau aplikasi. Cukup isi satu formulir.</h1>
		<p class="lead">
			Ceritakan usaha dan kebutuhan Anda dalam 8 langkah sederhana. Anda bisa memesan website,
			aplikasi, atau sistem yang mengikuti cara kerja tim Anda. Setelah formulir dikirim, tim
			kami membacanya lalu menghubungi Anda dengan rencana kerja dan perkiraan biaya. Tidak
			perlu paham istilah teknis.
		</p>
		<div class="aksi">
			<a class="btn btn-primer" href="/brief">Mulai isi formulir</a>
			<a class="btn btn-kedua" href="/contoh">Lihat contoh isian</a>
		</div>
		<ol class="langkah" id="cara">
			<li>
				<span class="nomor">01</span>
				<div><b>Isi 8 langkah</b><span>Sekitar 15–25 menit. Jawaban tersimpan otomatis, jadi bisa dilanjutkan nanti.</span></div>
			</li>
			<li>
				<span class="nomor">02</span>
				<div><b>Periksa, lalu kirim</b><span>Anda mendapat nomor tiket. Logo, katalog, dan foto bisa ikut diunggah.</span></div>
			</li>
			<li>
				<span class="nomor">03</span>
				<div><b>Kami hubungi Anda</b><span>Lewat WhatsApp atau email yang Anda tulis. Kami bahas kebutuhan, waktu pengerjaan, dan biaya.</span></div>
			</li>
		</ol>
	</div>
	<div class="pembuka-kanan">
		<div class="dossier-mini" role="img" aria-label="Contoh formulir kebutuhan 8 langkah WebCo.">
			<div class="dossier-kepala"><b>FORMULIR KEBUTUHAN</b><code>8 langkah · 1 kirim</code></div>
			<ol class="dossier-bab">
				{#each STEPS as s}
					<li><span class="n">{s.no}</span><span class="t">{ringkas[s.id]}</span><span class="s">{s.wajib ? 'perlu diisi' : 'boleh dilewati'}</span></li>
				{/each}
			</ol>
		</div>
		<div class="baris-jaminan" id="ditanyakan">
			<div><b>Tanpa akun.</b> Tidak perlu daftar atau membuat kata sandi.</div>
			<div><b>Bisa berhenti dulu.</b> Jawaban tersimpan di perangkat ini. Lanjutkan kapan saja.</div>
		</div>
	</div>
</section>
