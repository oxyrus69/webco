<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();
	const r = $derived(data.row as any);
	const ada = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v));

	function tanggal(v: unknown) {
		try { return new Date(v as string).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }); }
		catch { return '—'; }
	}

	let sekarang = $state('');
	onMount(() => {
		try {
			sekarang = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
		} catch { sekarang = ''; }
		const t = setTimeout(() => window.print(), 700);
		return () => clearTimeout(t);
	});
</script>

<svelte:head><title>Dossier {r.ticket} — {r.namaResmi}</title></svelte:head>

<div class="workspace">
	<div class="wrap">
		<div class="no-print kotak-panduan">
			<b>Sebelum simpan PDF, rapikan dulu dialog cetaknya:</b>
			<ol>
				<li>Pada dialog cetak, <b>matikan "Header dan footer"</b> agar judul, URL, tanggal, dan nomor bawaan browser tidak ikut tercetak.</li>
				<li>Tujuan: <b>Save as PDF</b> · Ukuran kertas: <b>A4</b> · Margin: <b>Default</b>.</li>
				<li>Footer rapi (tiket, nomor halaman Indonesia, waktu cetak) sudah disiapkan otomatis di tiap halaman.</li>
			</ol>
		</div>
		<div class="no-print" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
			<button class="btn btn-primer" onclick={() => window.print()}>Cetak / Simpan PDF</button>
			<a class="btn btn-kedua" href={`/admin/${r.id}`}>Kembali ke detail</a>
		</div>

		<div class="hanya-cetak kaki-halaman" aria-hidden="true">
			<span>Dossier {r.ticket} · {r.namaResmi}</span>
			<span><span class="nomor"></span> · Dicetak {sekarang || tanggal(r.createdAt)}</span>
		</div>

		<article class="lembar">
			<p class="no-bab">DOKUMEN DOSSIER BRIEFING · WEBCO.</p>
			<h1 class="judul-halaman">{r.namaResmi}</h1>
			<dl class="meta-cetak">
				<div><dt>Nomor tiket</dt><dd>{r.ticket}</dd></div>
				<div><dt>Tanggal masuk</dt><dd>{tanggal(r.createdAt)}</dd></div>
				<div><dt>Status</dt><dd>{r.status}</dd></div>
				<div><dt>Kontak</dt><dd>{r.kontakNama} — {r.kontakJabatan} · {r.kontakWa} · {r.kontakEmail}</dd></div>
			</dl>

			<section><h2>Bab 01 — Informasi Kontak Klien</h2><p>Nama: {ada(r.kontakNama)}<br />Jabatan: {ada(r.kontakJabatan)}<br />Telepon/WhatsApp: {ada(r.kontakWa)}<br />Email: {ada(r.kontakEmail)}</p></section>
			<section><h2>Bab 02 — Identitas Dasar Perusahaan</h2><p>Nama resmi: {ada(r.namaResmi)}<br />Singkatan: {ada(r.singkatan)}<br />Tagline: {ada(r.tagline)}<br />Tahun berdiri: {ada(r.tahunBerdiri)}<br />Bidang: {ada(r.bidang)}<br />Alamat pusat: {ada(r.alamatPusat)}<br />Alamat cabang: {ada(r.alamatCabang)}<br />Telepon: {ada(r.teleponPerusahaan)}<br />Email: {ada(r.emailPerusahaan)}</p>{#if r.logoUrl}<p>Berkas logo: <a href={r.logoUrl}>{r.logoUrl}</a></p>{/if}</section>
			<section><h2>Bab 03 — Profil &amp; Latar Belakang</h2><h3>Sejarah</h3><p style="white-space:pre-wrap">{ada(r.sejarah)}</p><h3>Visi</h3><p style="white-space:pre-wrap">{ada(r.visi)}</p><h3>Misi</h3><p style="white-space:pre-wrap">{ada(r.misi)}</p><h3>Nilai inti</h3><p style="white-space:pre-wrap">{ada(r.coreValues)}</p><h3>Target market</h3><p style="white-space:pre-wrap">{ada(r.targetMarket)}</p></section>
			<section><h2>Bab 04 — Produk &amp; Layanan</h2><h3>Daftar produk</h3><p style="white-space:pre-wrap">{ada(r.daftarProduk)}</p><h3>Keunggulan</h3><p style="white-space:pre-wrap">{ada(r.usp)}</p>{#if r.katalogUrl}<p>Katalog: <a href={r.katalogUrl}>{r.katalogUrl}</a></p>{/if}</section>
			<section><h2>Bab 05 — Portofolio, Klien &amp; Testimoni</h2><p>Klien/mitra: {ada(r.klienDaftar)}</p>{#if r.logoKlienUrls?.length}<p>Logo klien:</p>{#each r.logoKlienUrls as u}<p><a href={u}>{u}</a></p>{/each}{/if}<p>Portofolio: {ada(r.portofolioDesc)}</p>{#if r.portofolioFileUrl}<p>Berkas portofolio: <a href={r.portofolioFileUrl}>{r.portofolioFileUrl}</a></p>{/if}<p>Testimoni: {ada(r.testimoni)}</p></section>
			<section><h2>Bab 06 — Tim &amp; Legalitas</h2><p style="white-space:pre-wrap">{ada(r.anggotaTim)}</p>{#if r.fotoTimUrls?.length}<p>Foto tim:</p>{#each r.fotoTimUrls as u}<p><a href={u}>{u}</a></p>{/each}{/if}<p>Legalitas: {ada(r.legalitasDesc)}</p>{#if r.legalitasFileUrl}<p>Berkas legalitas: <a href={r.legalitasFileUrl}>{r.legalitasFileUrl}</a></p>{/if}</section>
			<section><h2>Bab 07 — Tautan &amp; Sosial Media</h2><p>Instagram: {ada(r.instagram)}<br />LinkedIn: {ada(r.linkedin)}<br />Facebook/X: {ada(r.facebookX)}<br />YouTube/TikTok: {ada(r.youtubeTiktok)}</p></section>
			<section><h2>Bab 08 — Desain &amp; Fitur Web</h2><p>Warna identitas: {ada(r.warnaIdentitas)}<br />Kode hex: {ada(r.warnaHex1)}{r.warnaHex2 ? ` · ${r.warnaHex2}` : ''}<br />Gaya desain: {ada(r.gayaDesain)}{r.gayaLainnya ? ` (${r.gayaLainnya})` : ''}<br />Referensi: {ada(r.referensi)}<br />Fitur: {(r.fitur ?? []).join(', ') || '—'}<br />Catatan: {ada(r.catatan)}</p></section>

			<p class="persetujuan">Dokumen dossier {r.ticket} · status {r.status} · Panel Admin WebCo.</p>
		</article>
	</div>
</div>
