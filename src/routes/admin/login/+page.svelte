<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<svelte:head><title>Masuk Admin — WebCo.</title></svelte:head>

<div class="workspace">
	<div class="wrap">
		<div class="sukses" style="max-width: 480px">
			<p class="kicker">ADMIN · AKSES TERBATAS</p>
			<h1 class="judul-halaman">Masuk ruang admin</h1>
			<p class="persetujuan">Halaman dossier masuk hanya untuk tim WebCo. Masukkan kata kunci admin.</p>
			<form method="POST" action="?/masuk" use:enhance>
				<input type="hidden" name="lanjut" value={form?.lanjut ?? data.lanjut} />
				<div class="medan" class:invalid={form?.salah}>
					<label for="kunci">Kata kunci</label>
					<input id="kunci" name="kunci" type="password" autocomplete="current-password" />
					{#if form?.salah}<span class="galat">Kata kunci salah. Periksa lagi lalu coba sekali lagi.</span>{/if}
				</div>
				<button type="submit" class="btn btn-primer" style="width: 100%">Masuk</button>
			</form>
			<p class="draf-info"><a href="/">Kembali ke beranda</a></p>
		</div>
	</div>
</div>
