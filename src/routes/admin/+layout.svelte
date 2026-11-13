<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { tick, onMount } from 'svelte';

	let { data, children } = $props();
	let buka = $state(false);
	let kolaps = $state(false);
	let hp = $state(false);

	onMount(() => {
		kolaps = localStorage.getItem('webco-rail-kolaps') === '1';
		const mq = window.matchMedia('(max-width: 1023px)');
		hp = mq.matches;
		const ubah = (e: MediaQueryListEvent) => (hp = e.matches);
		mq.addEventListener('change', ubah);
		return () => mq.removeEventListener('change', ubah);
	});

	// Collapsed layout is desktop-only; the mobile drawer always shows labels.
	const sempit = $derived(kolaps && !hp);

	function lipat() {
		kolaps = !kolaps;
		localStorage.setItem('webco-rail-kolaps', kolaps ? '1' : '0');
	}

	async function bukaCari() {
		if ($page.url.pathname !== '/admin') await goto('/admin');
		await tick();
		document.getElementById('q')?.focus();
	}

	function pintasan(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			bukaCari();
		}
	}

	const masuk = $derived(data.masuk ?? false);
	const counts = $derived(data.counts ?? { total: 0, baru: 0, diproses: 0, selesai: 0 });
	const diAdmin = $derived($page.url.pathname.startsWith('/admin'));
	const statusAktif = $derived($page.url.pathname === '/admin' ? ($page.url.searchParams.get('status') ?? 'semua') : '');
	const breadcrumb = $derived(
		$page.url.pathname === '/admin' ? 'Dashboard' :
		$page.url.pathname.startsWith('/admin/') && $page.url.pathname !== '/admin/keluar' ? 'Dossier / Detail' : 'Keluar'
	);

	function tutup() { buka = false; }
</script>

<svelte:head>
	<title>Panel Admin — WebCo.</title>
</svelte:head>

<svelte:window onkeydown={pintasan} />

<a class="skip" href="#isi-admin">Lewati ke isi</a>

{#if masuk}
<div class="admin-shell" class:kolaps={sempit}>
	{#if buka}<button class="sidebar-alas" aria-label="Tutup navigasi" onclick={tutup}></button>{/if}

	<!-- ZONE A: Collapsible Navigation Rail -->
	<aside class="admin-rail" class:terbuka={buka} class:kolaps={sempit} aria-label="Navigasi panel admin">
		<div class="rail-kepala">
			<a class="admin-merek" href="/admin" aria-label="Panel admin WebCo." onclick={tutup}>
				<span class="merek-mark">W</span>
				{#if !sempit}<span class="merek-nama">WebCo<span class="merek-titik">.</span></span><span class="merek-tag">console</span>{/if}
			</a>
			<button class="rail-toggle" aria-label={sempit ? 'Buka rail' : 'Lipat rail'} aria-expanded={!sempit} onclick={lipat}>
				{kolaps ? '»' : '«'}
			</button>
		</div>

		<div class="rail-body">
			<p class="rail-judul">Kelola</p>
			<nav aria-label="Dossier">
				<a href="/admin" class:aktif={diAdmin && $page.url.pathname === '/admin' && statusAktif === 'semua'} onclick={tutup} aria-label="Dashboard" title="Dashboard">
					<span class="rail-ikon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg></span>
					{#if !sempit}<span>Dashboard</span>{/if}
					<span class="badge">{counts.total}</span>
				</a>
				<a href="/admin?status=baru" class:aktif={statusAktif === 'baru'} onclick={tutup} aria-label="Baru masuk" title="Baru masuk">
					<span class="rail-ikon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg></span>
					{#if !sempit}<span>Baru masuk</span>{/if}
					{#if counts.baru > 0}<span class="badge badge-warn">{counts.baru}</span>{/if}
				</a>
				<a href="/admin?status=diproses" class:aktif={statusAktif === 'diproses'} onclick={tutup} aria-label="Diproses" title="Diproses">
					<span class="rail-ikon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></span>
					{#if !sempit}<span>Diproses</span>{/if}
					{#if counts.diproses > 0}<span class="badge">{counts.diproses}</span>{/if}
				</a>
				<a href="/admin?status=selesai" class:aktif={statusAktif === 'selesai'} onclick={tutup} aria-label="Selesai" title="Selesai">
					<span class="rail-ikon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></span>
					{#if !sempit}<span>Selesai</span>{/if}
					{#if counts.selesai > 0}<span class="badge badge-ok">{counts.selesai}</span>{/if}
				</a>
			</nav>
			<p class="rail-judul">Lainnya</p>
			<nav aria-label="Tautan luar">
				<a href="/" onclick={tutup} aria-label="Lihat situs" title="Lihat situs">
					<span class="rail-ikon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg></span>
					{#if !sempit}<span>Lihat situs</span>{/if}
				</a>
				<a href="/admin/keluar" onclick={tutup} aria-label="Keluar" title="Keluar">
					<span class="rail-ikon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg></span>
					{#if !sempit}<span>Keluar</span>{/if}
				</a>
			</nav>
		</div>

		<div class="rail-footer">
			<div class="health-pill" title="Database Neon">
				<span class="health-dot"></span>
				{#if !sempit}<span class="health-text">DB · Online</span>{/if}
			</div>
			<div class="role-badge">
				<span class="role-avatar">A</span>
				{#if !sempit}<span class="role-info"><b>Admin</b><span>WebCo. console</span></span>{/if}
			</div>
		</div>
	</aside>

	<!-- ZONE B + main content -->
	<div class="admin-utama">
		<header class="admin-bar">
			<div class="admin-bar-dalam">
				<button class="saklar-sidebar" aria-label={buka ? 'Tutup navigasi' : 'Buka navigasi'} aria-expanded={buka} onclick={() => (buka = !buka)}>
					<span></span><span></span><span></span>
				</button>
				<nav class="crumb" aria-label="Breadcrumb">
					<span>WebCo. Console</span>
					<span class="crumb-sep">/</span>
					<span class="crumb-aktif">{breadcrumb}</span>
				</nav>
				<div class="bar-aksi">
					<button class="cmd-trigger" aria-label="Cari dossier" title="Cari dossier (Ctrl+K)" onclick={bukaCari}>
						<span class="cmd-ikon" aria-hidden="true">⌕</span>
						<span class="cmd-teks">Cari atau lompat…</span>
						<kbd>Ctrl K</kbd>
					</button>
					<span class="telemetry-pill" title="Status sistem">
						<span class="health-dot"></span>
						Online
					</span>
					<a class="bar-ikon bar-notif" href="/admin?status=baru" title="Dossier baru">🔔</a>
					<a class="bar-ikon" href="/" title="Lihat situs">↗</a>
				</div>
			</div>
		</header>

		<main id="isi-admin">
			{@render children()}
		</main>
	</div>
</div>
{:else}
<main id="isi-admin">
	{@render children()}
</main>
{/if}