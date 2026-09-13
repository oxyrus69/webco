<script lang="ts">
	import { page } from '$app/stores';
	const tiket = $derived($page.url.searchParams.get('tiket') ?? '');
</script>

<svelte:head><title>Dossier terkirim — WebCo.</title></svelte:head>

<div class="workspace">
	<div class="wrap">
		<div class="sukses">
			<p class="kicker">✓ DOSSIER DITERIMA</p>
			<h1 class="judul-halaman">Terima kasih. Dossier Anda sudah masuk meja kami.</h1>
			{#if tiket}
				<p>Nomor tiket Anda:</p>
				<p><span class="tiket">{tiket}</span></p>
			{/if}
			<p style="color:var(--tinta-redup)">Simpan nomor tiket ini. Tim WebCo. akan menghubungi Anda melalui kontak di Bab 01 dalam 1–2 hari kerja untuk diskusi penawaran.</p>
			<div class="aksi" style="margin-top:20px">
				<a class="btn btn-primer" href="/">Kembali ke beranda</a>
				<a class="btn btn-kedua" href="/brief">Isi dossier lain</a>
			</div>
		</div>
	</div>
</div>
