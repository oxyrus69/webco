<script lang="ts">
	let { children } = $props();
</script>

<!-- THESIS: Ruang briefing dossier bengkel, bukan SaaS generik. OWN-WORLD: kertas arsip + tinta dongker + kuningan, Plus Jakarta Sans + JetBrains Mono data. STORY: pengunjung paham ini dokumen 8 bab, mengisi berurutan, mengirim sekali. FIRST VIEWPORT: kiri H1 pendek + 3 langkah + CTA; kanan miniatur dossier 8 bab. FORM: dossier ordner, seed webco-dossier-01. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->

<svelte:head>
	<title>WebCo. — Jasa Pembuatan Website &amp; Aplikasi</title>
</svelte:head>

<a class="skip" href="#isi">Lewati ke isi</a>

<header class="kepala">
	<div class="wrap kepala-dalam">
		<a class="merek" href="/" aria-label="WebCo. beranda">
			<span class="merek-nama">WebCo<span class="merek-titik">.</span></span>
			<span class="merek-tag">jasa website &amp; aplikasi</span>
		</a>
		<nav class="nav" aria-label="Navigasi utama">
			<a class="sembunyi-hp" href="/#cara">Cara kerja</a>
			<a class="sembunyi-hp" href="/#ditanyakan">Yang ditanyakan</a>
			<a class="btn btn-primer btn-kecil" href="/brief"><span class="label-panjang">Mulai isi formulir</span><span class="label-pendek">Isi formulir</span></a>
		</nav>
	</div>
</header>

<main id="isi">
	{@render children()}
</main>

<footer class="kaki">
	<div class="wrap kaki-dalam">
		<div><b style="color: var(--tinta)">WebCo.</b> — jasa pembuatan website &amp; aplikasi. Isi formulir sekali, kami balas dengan rencana dan biaya.</div>
	</div>
</footer>
