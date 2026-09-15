<script lang="ts">
	import {
		labelJenis,
		tautanLampiran,
		ukuranRingkas,
		type LampiranPilihan
	} from '$lib/pratinjau';

	// Pratinjau berkas yang sedang dipilih pengirim, sebelum dossier dikirim: gambar
	// tampil sebagai thumbnail (object URL berkas lokal atau tautan wadah), PDF tampil
	// sebagai penanda jenis dengan tautan buka ke penampil PDF browser.
	let {
		daftar,
		lebar = 128,
		tinggi = 76
	}: { daftar: LampiranPilihan[]; lebar?: number; tinggi?: number } = $props();

	// Indeks yang gambarnya gagal dimuat → jangan biarkan ikon gambar rusak tampil.
	let rusak = $state<Record<number, boolean>>({});
</script>

{#if daftar.length}
	<ul class="lampiran" style="--tinggi-lampiran: {tinggi}px; --lebar-lampiran: {lebar}px">
		{#each daftar as l, i (l.nama + i)}
			{@const mini = tautanLampiran(l, lebar)}
			<li class="lampiran-item">
				{#if mini && !rusak[i]}
					<a class="bingkai-lampiran" href={l.tautan} target="_blank" rel="noreferrer" title={`Buka ${l.nama}`}>
						<img
							src={mini}
							alt={`Pratinjau ${l.nama}`}
							decoding="async"
							onerror={() => (rusak[i] = true)}
						/>
					</a>
				{:else}
					<span class="cap-lampiran" aria-hidden="true">{labelJenis(l.jenis)}</span>
				{/if}
				<span class="teks-lampiran">
					<span class="nama-lampiran">{l.nama}</span>
					<span class="meta-lampiran">
						{ukuranRingkas(l.ukuran)} · <a href={l.tautan} target="_blank" rel="noreferrer">lihat</a>
					</span>
				</span>
			</li>
		{/each}
	</ul>
{/if}
