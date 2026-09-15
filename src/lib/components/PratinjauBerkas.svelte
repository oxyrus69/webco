<script lang="ts">
	import { jenisBerkas, namaBerkas, tautanMini } from '$lib/pratinjau';

	// Satu berkas klien: bingkai pratinjau + nama berkas mono yang selalu bisa dibuka penuh.
	// `ringkas` dipakai di daftar dossier: bingkai kecil saja, tanpa nama berkas.
	let {
		url,
		label = '',
		lebar = 320,
		tinggi = 150,
		ringkas = false
	}: { url: string; label?: string; lebar?: number; tinggi?: number; ringkas?: boolean } = $props();

	const nama = $derived(label || namaBerkas(url));
	const jenis = $derived(jenisBerkas(url));
	const keterangan = $derived(jenis === 'pdf' ? 'PDF' : jenis === 'gambar' ? 'gambar' : 'berkas');
	const mini = $derived(tautanMini(url, lebar, jenis));
	// Gambar dari lapis lain (Blob/Neon/lokal) ditampilkan apa adanya; PDF hanya bisa
	// dicuplik bila tersimpan di Cloudinary, karena butuh transformasi halaman pertama.
	const sumber = $derived(jenis === 'gambar' ? (mini ?? url) : mini);
	// Pratinjau boleh gagal (berkas hilang, format tak bisa digambar) — jangan tampilkan
	// ikon gambar rusak, jatuh ke tautan biasa saja.
	let gagal = $state(false);
</script>

{#if sumber && !gagal}
	{#if ringkas}
		<a
			class="bingkai bingkai-mini"
			href={url}
			target="_blank"
			rel="noreferrer"
			title={`Buka ${nama} ukuran penuh`}
			style="--tinggi-pratinjau: {tinggi}px"
		>
			<img src={sumber} alt={`Pratinjau ${nama}`} loading="lazy" decoding="async" onerror={() => (gagal = true)} />
		</a>
	{:else}
		<figure class="pratinjau" style="--tinggi-pratinjau: {tinggi}px">
			<a class="bingkai" href={url} target="_blank" rel="noreferrer" title={`Buka ${nama} ukuran penuh`}>
				<img src={sumber} alt={`Pratinjau ${nama}`} loading="lazy" decoding="async" onerror={() => (gagal = true)} />
				{#if jenis === 'pdf'}<span class="cap-jenis">PDF · halaman 1</span>{/if}
			</a>
			<figcaption>
				<a href={url} target="_blank" rel="noreferrer">{nama}</a>
				<span class="jenis">{keterangan}</span>
			</figcaption>
		</figure>
	{/if}
{:else}
	<p class="berkas">
		<a href={url} target="_blank" rel="noreferrer">{nama}</a>
		<span class="jenis">{keterangan}</span>
	</p>
{/if}
