<script lang="ts">
	import { enhance } from '$app/forms';
	import PratinjauBerkas from '$lib/components/PratinjauBerkas.svelte';
	import { ringkasanBerkas } from '$lib/pratinjau';

	let { data, form } = $props();
	const rows = $derived(data.rows ?? []);
	const counts = $derived(data.counts);
	const berkas = (r: any) => ringkasanBerkas(r);

	function tanggal(v: unknown) {
		try { return new Date(v as string).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); }
		catch { return '—'; }
	}
</script>

<svelte:head><title>Dashboard — Panel Admin WebCo.</title></svelte:head>

<div class="workspace">
	<div class="wrap">
		<p class="crumb">PANEL ADMIN · KELOLA DOSSIER CLIENT</p>
		<h1 class="judul-halaman">Dashboard dossier</h1>
		<p class="persetujuan">{counts.total} dossier tersimpan · {counts.mingguIni} masuk 7 hari terakhir · klik tiket untuk membaca dan menindaklanjuti.</p>

		{#if data.dbMati}
			<div class="detail-bab" role="alert">
				<h3>Database tidak dapat dihubungi</h3>
				<p class="persetujuan">Periksa <code>DATABASE_URL</code> di file .env (Neon Postgres), jalankan <code>npm run db:migrate</code>, lalu muat ulang.</p>
			</div>
		{:else}
			<div class="stat-grid" role="group" aria-label="Ringkasan dossier">
				<div class="stat"><b>{counts.total}</b><span>Total dossier</span></div>
				<div class="stat" class:aktif={data.status === 'baru'}><b>{counts.baru}</b><span>Baru — perlu dibaca</span></div>
				<div class="stat" class:aktif={data.status === 'diproses'}><b>{counts.diproses}</b><span>Sedang diproses</span></div>
				<div class="stat" class:aktif={data.status === 'selesai'}><b>{counts.selesai}</b><span>Selesai</span></div>
			</div>

			<form class="toolbar" method="GET" action="/admin" role="search" aria-label="Cari dan saring dossier">
				<div class="medan">
					<label for="q">Cari perusahaan, kontak, tiket, bidang</label>
					<input id="q" name="q" type="search" value={data.q} placeholder="cth: baja, Ratna, WB-2026" />
				</div>
				<div class="medan" style="max-width: 220px">
					<label for="status">Status</label>
					<select id="status" name="status">
						<option value="semua" selected={data.status === 'semua'}>Semua status</option>
						<option value="baru" selected={data.status === 'baru'}>Baru</option>
						<option value="diproses" selected={data.status === 'diproses'}>Diproses</option>
						<option value="selesai" selected={data.status === 'selesai'}>Selesai</option>
					</select>
				</div>
				<button class="btn btn-primer" type="submit">Terapkan</button>
				{#if data.q || data.status !== 'semua'}<a class="btn btn-kedua" href="/admin">Atur ulang</a>{/if}
			</form>

			{#if form?.galat}<p class="galat" role="alert">{form.galat}</p>{/if}
			{#if form?.sukses}<p role="status" style="color: var(--lumut); font-weight: 700">Dossier {form.tiket} terhapus.</p>{/if}

			{#if !rows.length}
				<div class="kosong">
					<h2>{counts.total ? 'Tidak ada yang cocok' : 'Belum ada dossier'}</h2>
					<p>{counts.total ? 'Ubah kata kunci atau status, atau atur ulang saringan.' : 'Bagikan tautan /brief kepada calon customer. Dossier yang masuk tampil di sini.'}</p>
				</div>
			{:else}
				<p class="hasil-info" aria-live="polite">Menampilkan {rows.length} dossier.</p>
				<div style="overflow-x:auto">
					<table class="tabel">
						<thead><tr><th>Tiket</th><th>Perusahaan</th><th>Kontak</th><th>Berkas</th><th>Masuk</th><th>Status</th><th>Aksi</th></tr></thead>
						<tbody>
							{#each rows as r}
								{@const b = berkas(r)}
								<tr>
									<td><a class="tiket-link" href={`/admin/${r.id}`}>{r.ticket}</a></td>
									<td><b>{r.namaResmi}</b><br /><span style="color:var(--tinta-redup)">{r.bidang}</span></td>
									<td>{r.kontakNama}<br /><span style="color:var(--tinta-redup)">{r.kontakWa}</span></td>
									<td>
										{#if b.jumlah}
											<div class="berkas-mini">
												{#if r.logoUrl}<PratinjauBerkas url={r.logoUrl} lebar={96} tinggi={56} ringkas />{/if}
												<span class="jumlah" title={`Terlampir: ${b.isi.join(', ')}`}>{b.jumlah} berkas</span>
											</div>
										{:else}
											<span class="tanpa-berkas" title="Klien belum melampirkan berkas apa pun">belum ada</span>
										{/if}
									</td>
									<td style="white-space:nowrap">{tanggal(r.createdAt)}</td>
									<td><span class="lencana {r.status}">{r.status}</span></td>
									<td style="white-space:nowrap">
										<a class="btn btn-kedua btn-kecil" href={`/admin/${r.id}`}>Buka</a>
										<form method="POST" action="?/hapus" style="display:inline" use:enhance={({ cancel }) => { if (!confirm(`Hapus dossier ${r.ticket} (${r.namaResmi}) beserta berkasnya?`)) cancel(); }}>
											<input type="hidden" name="id" value={r.id} />
											<button class="btn btn-bahaya btn-kecil" type="submit" style="margin-left:6px">Hapus</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		{/if}
	</div>
</div>
