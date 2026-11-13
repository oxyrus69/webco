<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<svelte:head><title>Masuk Admin — WebCo.</title></svelte:head>

<div class="admin-login-wrap">
	<div class="admin-login-card">
		<div class="alc-merek">
			<span class="mark" aria-hidden="true">W</span>
			<b>WebCo.</b>
			<span class="tag">Console</span>
		</div>
		<p class="alc-eyebrow">ADMIN · AKSES TERBATAS</p>
		<h1>Masuk ruang admin</h1>
		<p>Halaman dossier masuk hanya untuk tim WebCo. Masukkan kata kunci admin.</p>
		<form method="POST" action="?/masuk" use:enhance>
			<input type="hidden" name="lanjut" value={form?.lanjut ?? data.lanjut} />
			<div class="medan" class:invalid={form?.salah}>
				<label for="kunci" style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px">Kata kunci</label>
				<input id="kunci" name="kunci" type="password" autocomplete="current-password" />
				{#if form?.salah}<span class="galat" style="font-size:12px;color:#991b1b;font-weight:600;display:block;margin-top:4px">Kata kunci salah. Periksa lagi lalu coba sekali lagi.</span>{/if}
			</div>
			<button type="submit" class="btn">Masuk</button>
		</form>
		<p class="tombol-kecil"><a href="/">Kembali ke beranda</a></p>
	</div>
</div>