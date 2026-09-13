<script lang="ts">
	import { enhance } from '$app/forms';
	let { data } = $props();
	const r = $derived(data.row as any);
	const berkas = (u?: string | null) => !!u;

	const daftar = [
		{ no: '01', judul: 'Informasi Kontak Klien', pendek: 'Kontak' },
		{ no: '02', judul: 'Identitas Dasar Perusahaan', pendek: 'Identitas' },
		{ no: '03', judul: 'Profil & Latar Belakang', pendek: 'Profil' },
		{ no: '04', judul: 'Produk & Layanan', pendek: 'Produk' },
		{ no: '05', judul: 'Portofolio, Klien & Testimoni', pendek: 'Portofolio' },
		{ no: '06', judul: 'Tim & Legalitas', pendek: 'Tim' },
		{ no: '07', judul: 'Tautan & Sosial Media', pendek: 'Sosial' },
		{ no: '08', judul: 'Desain & Fitur Web', pendek: 'Desain' }
	];

	let bab = $state(0);
	const adaIsi = $derived([
		!!r.kontakNama,
		!!r.namaResmi,
		!!(r.sejarah || r.visi || r.misi),
		!!r.daftarProduk,
		!!(r.klienDaftar || r.portofolioDesc || r.testimoni || r.portofolioFileUrl || r.logoKlienUrls?.length),
		!!(r.anggotaTim || r.legalitasDesc || r.legalitasFileUrl || r.fotoTimUrls?.length),
		!!(r.instagram || r.linkedin || r.facebookX || r.youtubeTiktok),
		!!(r.warnaIdentitas || r.gayaDesain || r.referensi || r.catatan || r.fitur?.length)
	]);
	const terisi = $derived(adaIsi.filter(Boolean).length);

	function ke(i: number) {
		bab = Math.min(7, Math.max(0, i));
		document.getElementById('panel-bab')?.scrollIntoView({ block: 'start' });
	}
</script>

<svelte:head><title>{r.ticket} — {r.namaResmi} — WebCo.</title></svelte:head>

<div class="workspace">
	<div class="wrap">
		<p class="crumb"><a href="/admin">Dashboard</a> / {r.ticket}</p>
		<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px">
			<h1 class="judul-detail">{r.namaResmi}</h1>
			<span class="lencana {r.status}">{r.status}</span>
		</div>

		<form method="POST" action="?/status" use:enhance style="display:flex;gap:10px;align-items:center;margin-bottom:20px;flex-wrap:wrap">
			<label for="status" class="label-status">Ubah status:</label>
			<select id="status" name="status" style="font:inherit;padding:9px 12px;border:1px solid #b9b09a;border-radius:6px">
				<option value="baru" selected={r.status === 'baru'}>baru</option>
				<option value="diproses" selected={r.status === 'diproses'}>diproses</option>
				<option value="selesai" selected={r.status === 'selesai'}>selesai</option>
			</select>
			<button class="btn btn-kedua btn-kecil" type="submit">Simpan status</button>
			<a class="btn btn-kedua btn-kecil" href={`mailto:${r.kontakEmail}?subject=Menindaklanjuti briefing ${r.ticket}`}>Balas via email</a>
			<a class="btn btn-kedua btn-kecil" href={`https://wa.me/${String(r.kontakWa).replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">Buka WhatsApp</a>
			<a class="btn btn-primer btn-kecil" href={`/admin/${r.id}/cetak`} target="_blank" rel="noreferrer">Unduh PDF</a>
		</form>
		<form method="POST" action="?/hapus" use:enhance={({ cancel }) => { if (!confirm(`Hapus dossier ${r.ticket} beserta berkasnya? Tindakan ini tidak bisa dibatalkan.`)) cancel(); }} style="margin-bottom:20px">
			<button class="btn btn-bahaya btn-kecil" type="submit">Hapus dossier ini</button>
		</form>

		<div class="tabs" role="tablist" aria-label="Bab dossier">
			{#each daftar as d, i}
				<button class="tab" class:aktif={bab === i} role="tab" aria-selected={bab === i} aria-controls="panel-bab" onclick={() => ke(i)}>
					<span class="no">{d.no}</span><span>{d.pendek}</span><span class="titik" class:isi={adaIsi[i]} title={adaIsi[i] ? 'Terisi' : 'Kosong'}></span>
				</button>
			{/each}
		</div>
		<p class="hasil-info" aria-live="polite">Bab {daftar[bab].no} dari 08 · {terisi} dari 8 bab terisi.</p>

		<div id="panel-bab" role="tabpanel" aria-label={`Bab ${daftar[bab].no}: ${daftar[bab].judul}`}>
			{#if bab === 0}
				<section class="detail-bab"><span class="no-bab">BAB 01 · {daftar[0].judul}</span><h3>{r.kontakNama} — {r.kontakJabatan}</h3><p>{r.kontakWa} · {r.kontakEmail}</p></section>
			{:else if bab === 1}
				<section class="detail-bab"><span class="no-bab">BAB 02 · {daftar[1].judul}</span><h3>{r.namaResmi}{r.singkatan ? ` (${r.singkatan})` : ''}</h3><p>{r.tagline ?? ''}</p><p>Tahun {r.tahunBerdiri ?? '—'} · {r.bidang}</p><p>{r.alamatPusat}</p>{#if r.alamatCabang}<p>Cabang: {r.alamatCabang}</p>{/if}<p>{r.teleponPerusahaan ?? ''} · {r.emailPerusahaan ?? ''}</p>{#if berkas(r.logoUrl)}<p class="berkas">Logo: <a href={r.logoUrl} target="_blank" rel="noreferrer">unduh / buka</a></p>{/if}</section>
			{:else if bab === 2}
				<section class="detail-bab"><span class="no-bab">BAB 03 · {daftar[2].judul}</span><h3>Sejarah</h3><p style="white-space:pre-wrap">{r.sejarah ?? '—'}</p><h3>Visi</h3><p style="white-space:pre-wrap">{r.visi ?? '—'}</p><h3>Misi</h3><p style="white-space:pre-wrap">{r.misi ?? '—'}</p><h3>Nilai inti</h3><p style="white-space:pre-wrap">{r.coreValues ?? '—'}</p><h3>Target market</h3><p style="white-space:pre-wrap">{r.targetMarket ?? '—'}</p></section>
			{:else if bab === 3}
				<section class="detail-bab"><span class="no-bab">BAB 04 · {daftar[3].judul}</span><h3>Produk / layanan</h3><p style="white-space:pre-wrap">{r.daftarProduk ?? '—'}</p><h3>Keunggulan</h3><p style="white-space:pre-wrap">{r.usp ?? '—'}</p>{#if berkas(r.katalogUrl)}<p class="berkas">Katalog: <a href={r.katalogUrl} target="_blank" rel="noreferrer">unduh PDF</a></p>{/if}</section>
			{:else if bab === 4}
				<section class="detail-bab"><span class="no-bab">BAB 05 · {daftar[4].judul}</span><p><b>Klien:</b> {r.klienDaftar ?? '—'}</p>{#if r.logoKlienUrls?.length}<p>Berkas logo klien:</p>{#each r.logoKlienUrls as u}<p class="berkas"><a href={u} target="_blank" rel="noreferrer">{u}</a></p>{/each}{/if}<p><b>Portofolio:</b> {r.portofolioDesc ?? '—'}</p>{#if berkas(r.portofolioFileUrl)}<p class="berkas">Berkas: <a href={r.portofolioFileUrl} target="_blank" rel="noreferrer">unduh</a></p>{/if}<p><b>Testimoni:</b> {r.testimoni ?? '—'}</p></section>
			{:else if bab === 5}
				<section class="detail-bab"><span class="no-bab">BAB 06 · {daftar[5].judul}</span><p style="white-space:pre-wrap">{r.anggotaTim ?? '—'}</p>{#if r.fotoTimUrls?.length}{#each r.fotoTimUrls as u}<p class="berkas"><a href={u} target="_blank" rel="noreferrer">{u}</a></p>{/each}{/if}<p><b>Legalitas:</b> {r.legalitasDesc ?? '—'}</p>{#if berkas(r.legalitasFileUrl)}<p class="berkas">Berkas: <a href={r.legalitasFileUrl} target="_blank" rel="noreferrer">unduh</a></p>{/if}</section>
			{:else if bab === 6}
				<section class="detail-bab"><span class="no-bab">BAB 07 · {daftar[6].judul}</span><p>IG: {r.instagram ?? '—'}<br />LinkedIn: {r.linkedin ?? '—'}<br />FB/X: {r.facebookX ?? '—'}<br />YT/TikTok: {r.youtubeTiktok ?? '—'}</p></section>
			{:else}
				<section class="detail-bab"><span class="no-bab">BAB 08 · {daftar[7].judul}</span><p><b>Warna:</b> {r.warnaIdentitas ?? '—'} · <b>Gaya:</b> {r.gayaDesain ?? '—'}{r.gayaLainnya ? ` (${r.gayaLainnya})` : ''}</p>{#if r.warnaHex1 || r.warnaHex2}<p><b>Kode hex:</b> <span class="baris-hex">{#if r.warnaHex1}<input class="swatch" type="color" value={r.warnaHex1} disabled aria-hidden="true" /><code>{r.warnaHex1}</code>{/if}{#if r.warnaHex2}<input class="swatch" type="color" value={r.warnaHex2} disabled aria-hidden="true" /><code>{r.warnaHex2}</code>{/if}</span></p>{/if}<p><b>Referensi:</b> {r.referensi ?? '—'}</p><p><b>Fitur:</b> {(r.fitur ?? []).join(', ') || '—'}</p><p><b>Catatan:</b> {r.catatan ?? '—'}</p></section>
			{/if}
			<div class="tab-nav">
				{#if bab > 0}<button class="btn btn-kedua" onclick={() => ke(bab - 1)}>← {daftar[bab - 1].pendek}</button>{:else}<span></span>{/if}
				{#if bab < 7}<button class="btn btn-primer" onclick={() => ke(bab + 1)}>{daftar[bab + 1].pendek} →</button>{/if}
			</div>
		</div>
	</div>
</div>
