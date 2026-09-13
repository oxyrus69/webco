<script lang="ts">
	import { STEPS } from '$lib/brief/steps';
</script>

<section class="wrap pembuka">
	<div>
		<h1>Pesan website tanpa bolak-balik chat. Cukup isi satu dossier.</h1>
		<p class="lead">
			WebCo. memandu Anda menulis kebutuhan website dalam 8 bab — dari kontak hingga warna dan
			fitur. Sekali kirim, tim kami membaca utuh dan menghubungi Anda dengan penawaran yang
			sudah tepat.
		</p>
		<div class="aksi">
			<a class="btn btn-primer" href="/brief">Mulai isi briefing</a>
			<a class="btn btn-kedua" href="/contoh">Lihat contoh dossier</a>
		</div>
		<ol class="langkah" id="cara">
			<li>
				<span class="nomor">Langkah 1</span>
				<div><b>Isi 8 bab berurutan</b><span>Sekitar 15–25 menit. Draf tersimpan otomatis di perangkat Anda.</span></div>
			</li>
			<li>
				<span class="nomor">Langkah 2</span>
				<div><b>Periksa ringkasan dan kirim</b><span>Anda dapat nomor tiket. Berkas logo dan katalog ikut terkirim.</span></div>
			</li>
			<li>
				<span class="nomor">Langkah 3</span>
				<div><b>Kami menghubungi Anda</b><span>Melalui nomor WhatsApp dan email yang Anda tulis di Bab 01.</span></div>
			</li>
		</ol>
	</div>
	<div>
		<div class="dossier-mini" role="img" aria-label="Contoh dossier 8 bab WebCo.">
			<div class="dossier-kepala"><b>DOSSIER BRIEFING — WB/2026</b><code>8 bab · 1 kirim</code></div>
			<ol class="dossier-bab">
				{#each STEPS as s}
					<li><span class="n">{s.no}</span><span class="t">{s.judul}</span><span class="s">{s.wajib ? 'wajib' : 'opsional'}</span></li>
				{/each}
			</ol>
		</div>
		<div class="baris-jaminan" id="bab">
			<div><b>Validasi per bab.</b> Tidak bisa lanjut sebelum yang wajib beres.</div>
			<div><b>Berkas jelas.</b> Logo, katalog PDF, foto tim — ada batas ukuran tertulis.</div>
		</div>
	</div>
</section>
