<script lang="ts">
	import { page } from '$app/stores';
	const tiket = $derived($page.url.searchParams.get('tiket') ?? '');
</script>

<svelte:head><title>Formulir terkirim — WebCo.</title></svelte:head>

<div class="workspace">
	<div class="wrap">
		<div class="sukses">
			<p class="kicker">✓ FORMULIR DITERIMA</p>
			<h1 class="judul-halaman">Terima kasih. Formulir Anda sudah kami terima.</h1>
			{#if tiket}
				<p>Nomor tiket Anda:</p>
				<p><span class="tiket">{tiket}</span></p>
			{/if}
			<p style="color:var(--tinta-redup)">Simpan nomor tiket ini. Tim WebCo. akan menghubungi Anda lewat kontak di langkah 01 dalam 1–2 hari kerja untuk membahas rencana kerja dan biaya.</p>
			<div class="aksi" style="margin-top:20px">
				<a class="btn btn-primer" href="/">Kembali ke beranda</a>
				<a class="btn btn-kedua" href="/brief">Isi formulir lain</a>
			</div>
		</div>
	</div>
</div>
