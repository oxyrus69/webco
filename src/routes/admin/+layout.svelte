<script lang="ts">
	import { page } from '$app/stores';

	let { data, children } = $props();
	let buka = $state(false);

	const masuk = $derived(data.masuk ?? false);

	const counts = $derived(data.counts ?? { total: 0, baru: 0, diproses: 0, selesai: 0 });
	const diAdmin = $derived($page.url.pathname.startsWith('/admin'));
	const statusAktif = $derived($page.url.pathname === '/admin' ? ($page.url.searchParams.get('status') ?? 'semua') : '');

	function tutup() { buka = false; }
</script>

<svelte:head>
	<title>Panel Admin — WebCo.</title>
</svelte:head>

<a class="skip" href="#isi-admin">Lewati ke isi</a>

{#if masuk}
<div class="admin-shell">
	{#if buka}<button class="sidebar-alas" aria-label="Tutup navigasi" onclick={tutup}></button>{/if}
	<aside class="sidebar" class:terbuka={buka} aria-label="Navigasi panel admin">
		<a class="admin-merek" href="/admin" aria-label="Panel admin WebCo." onclick={tutup}>
			<span class="merek-nama">WebCo<span class="merek-titik">.</span></span>
		</a>
		<p class="sidebar-judul">Kelola</p>
		<nav aria-label="Dossier">
			<a href="/admin" class:aktif={diAdmin && $page.url.pathname === '/admin' && statusAktif === 'semua'} onclick={tutup}>
				<span>Dashboard</span><span class="badge">{counts.total}</span>
			</a>
			<a href="/admin?status=baru" class:aktif={statusAktif === 'baru'} onclick={tutup}>
				<span>Baru masuk</span><span class="badge">{counts.baru}</span>
			</a>
			<a href="/admin?status=diproses" class:aktif={statusAktif === 'diproses'} onclick={tutup}>
				<span>Diproses</span><span class="badge">{counts.diproses}</span>
			</a>
			<a href="/admin?status=selesai" class:aktif={statusAktif === 'selesai'} onclick={tutup}>
				<span>Selesai</span><span class="badge">{counts.selesai}</span>
			</a>
		</nav>
		<p class="sidebar-judul">Lainnya</p>
		<nav aria-label="Tautan luar">
			<a href="/">Lihat situs</a>
			<a href="/admin/keluar">Keluar</a>
		</nav>
	</aside>

	<div class="admin-utama">
		<header class="admin-bar">
			<div class="wrap admin-bar-dalam">
				<button class="saklar-sidebar" aria-label={buka ? 'Tutup navigasi' : 'Buka navigasi'} aria-expanded={buka} onclick={() => (buka = !buka)}>
					<span></span><span></span><span></span>
				</button>
				<span class="admin-judul-halaman">Ruang kerja dossier client</span>
				<nav class="admin-nav" aria-label="Navigasi admin">
					<a href="/">Lihat situs</a>
					<a href="/admin/keluar">Keluar</a>
				</nav>
			</div>
		</header>

		<main id="isi-admin">
			{@render children()}
		</main>

		<footer class="kaki">
			<div class="wrap kaki-dalam">
				<div>Ruang kerja internal WebCo. — dossier client.</div>
			</div>
		</footer>
	</div>
</div>
{:else}
	<main id="isi-admin">
		{@render children()}
	</main>
{/if}
