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

	// KPI deltas (simple: baru vs total share)
	const pctBaru = $derived(counts.total ? Math.round((counts.baru / counts.total) * 100) : 0);
	const pctSelesai = $derived(counts.total ? Math.round((counts.selesai / counts.total) * 100) : 0);
</script>

<svelte:head><title>Dashboard — Panel Admin WebCo.</title></svelte:head>

<div class="subheader">
	<div>
		<div class="sh-kiri"><span class="sh-judul">Dashboard dossier</span><span class="sh-badge">{counts.total} dossier</span></div>
		<p class="sh-desc">{counts.mingguIni} masuk 7 hari terakhir · klik tiket untuk membaca dan menindaklanjuti.</p>
	</div>
	<div class="sh-kanan">
		<a class="btn btn-kedua btn-sm" href="/admin?status=semua">Atur ulang saringan</a>
		<a class="btn btn-primer btn-sm" href="/brief" target="_blank">+ Dossier baru</a>
	</div>
</div>

{#if data.dbMati}
	<div class="alert-banner danger" role="alert">
		<span>⚠</span>
		<div><b>Database tidak dapat dihubungi</b> — periksa <code>DATABASE_URL</code> (Neon Postgres), jalankan <code>npm run db:migrate</code>, lalu muat ulang.</div>
	</div>
{:else}
	<!-- D1: KPI strip (4-layer cards) -->
	<div class="kpi-grid" role="group" aria-label="Ringkasan dossier">
		<div class="kpi-card">
			<div class="kpi-label">Total dossier <span title="Rumus: count(*)">ⓘ</span></div>
			<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px">
				<span class="kpi-value">{counts.total}</span>
				<span class="kpi-delta flat">semua</span>
			</div>
			<div class="kpi-footer"><span>7 hari: <b>{counts.mingguIni}</b> masuk</span><span>target —</span></div>
		</div>
		<div class="kpi-card">
			<div class="kpi-label">Baru — perlu dibaca <span>ⓘ</span></div>
			<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px">
				<span class="kpi-value">{counts.baru}</span>
				<span class="kpi-delta {counts.baru > 0 ? 'down' : 'flat'}">{counts.baru > 0 ? 'perlu tindakan' : 'kosong'}</span>
			</div>
			<div class="kpi-footer"><span>Share: <b>{pctBaru}%</b></span><span>SLA 24 jam</span></div>
		</div>
		<div class="kpi-card">
			<div class="kpi-label">Sedang diproses <span>ⓘ</span></div>
			<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px">
				<span class="kpi-value">{counts.diproses}</span>
				<span class="kpi-delta flat">aktif</span>
			</div>
			<div class="kpi-footer"><span>Dalam antrian</span><span>—</span></div>
		</div>
		<div class="kpi-card">
			<div class="kpi-label">Selesai <span>ⓘ</span></div>
			<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px">
				<span class="kpi-value">{counts.selesai}</span>
				<span class="kpi-delta up">{pctSelesai}%</span>
			</div>
			<div class="kpi-footer"><span>Rasio selesai</span><span>target 90%</span></div>
		</div>
	</div>

	<!-- Zone D: Multi-pane workspace -->
	<div class="workspace-grid">
		<!-- D2: Main operational area -->
		<div style="display:grid;gap:12px">
			{#if form?.galat}<p class="galat" role="alert">{form.galat}</p>{/if}
			{#if form?.sukses}<p role="status" style="color:#065f46;font-weight:700">Dossier {form.tiket} terhapus.</p>{/if}

			<!-- Data grid toolbar -->
			<form class="grid-toolbar" method="GET" action="/admin" role="search" aria-label="Cari dan saring dossier">
				<div class="searchbox">
					<span style="color:#94a3b8">⌕</span>
					<input id="q" name="q" type="search" value={data.q} placeholder="Cari perusahaan, kontak, tiket, bidang…" />
					<span class="kbd">/</span>
				</div>
				<div class="filter-chip" class:aktif={data.status === 'semua'}><a href="/admin?status=semua&q={data.q ?? ''}" style="color:inherit;text-decoration:none">Semua</a></div>
				<div class="filter-chip" class:aktif={data.status === 'baru'}><a href="/admin?status=baru&q={data.q ?? ''}" style="color:inherit;text-decoration:none">Baru <span class="count">{counts.baru}</span></a></div>
				<div class="filter-chip" class:aktif={data.status === 'diproses'}><a href="/admin?status=diproses&q={data.q ?? ''}" style="color:inherit;text-decoration:none">Diproses <span class="count">{counts.diproses}</span></a></div>
				<div class="filter-chip" class:aktif={data.status === 'selesai'}><a href="/admin?status=selesai&q={data.q ?? ''}" style="color:inherit;text-decoration:none">Selesai <span class="count">{counts.selesai}</span></a></div>
				<button class="btn btn-primer btn-sm" type="submit">Terapkan</button>
				{#if data.q || data.status !== 'semua'}<a class="btn btn-kedua btn-sm" href="/admin">Atur ulang</a>{/if}
			</form>

			{#if !rows.length}
				<div class="kosong">
					<h2>{counts.total ? 'Tidak ada yang cocok' : 'Belum ada dossier'}</h2>
					<p>{counts.total ? 'Ubah kata kunci atau status, atau atur ulang saringan.' : 'Bagikan tautan /brief kepada calon customer. Dossier yang masuk tampil di sini.'}</p>
				</div>
			{:else}
				<div class="ent-table-wrap">
					<div class="ent-table-scroll">
						<table class="ent-table">
							<thead><tr>
								<th>Tiket</th><th>Perusahaan</th><th>Kontak</th><th>Masuk</th><th>Status</th><th style="text-align:right">Aksi</th>
							</tr></thead>
							<tbody>
								{#each rows as r}
									{@const b = berkas(r)}
									<tr>
										<td class="mono"><a class="tiket-link" href={`/admin/${r.id}`}>{r.ticket}</a></td>
										<td><b>{r.namaResmi}</b><span class="cell-sub">{r.bidang}{#if b.jumlah} · {b.jumlah} berkas{/if}</span></td>
										<td>{r.kontakNama}<span class="cell-sub">{r.kontakWa}</span></td>
										<td class="mono" style="font-size:11px">{tanggal(r.createdAt)}</td>
										<td><span class="status-pill {r.status}">{r.status}</span></td>
										<td>
											<div class="row-aksi">
												<a class="quick-btn" href={`/admin/${r.id}`}>Buka</a>
												<form method="POST" action="?/hapus" style="display:inline" use:enhance={({ cancel }) => { if (!confirm(`Hapus dossier ${r.ticket} (${r.namaResmi}) beserta berkasnya?`)) cancel(); }}>
													<input type="hidden" name="id" value={r.id} />
													<button class="quick-btn danger" type="submit">Hapus</button>
												</form>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div class="table-footer">
						<span>Menampilkan <b class="agg">{rows.length}</b> dari <b class="agg">{counts.total}</b> dossier · Total baru <b class="agg">{counts.baru}</b></span>
						<div class="pag">
							<button type="button" disabled aria-label="Sebelumnya">‹</button>
							<span class="info">1 / 1</span>
							<button type="button" disabled aria-label="Berikutnya">›</button>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- D3: Telemetry rail -->
		<aside class="telemetry-rail">
			<div class="telemetry-card">
				<div class="tc-judul">Rekomendasi DSS <span class="live">live</span></div>
				{#if counts.baru > 0}
					<div class="dss-item">
						<div class="dss-fakta">{counts.baru} dossier baru belum dibaca.</div>
						<div class="dss-dampak">{counts.baru} tindakan</div>
						<div class="dss-aksi">
							<button class="primary" onclick={() => location.href='/admin?status=baru'}>Kerjakan</button>
							<button>Tunda</button>
						</div>
					</div>
				{:else}
					<p style="font-size:12px;color:#64748b;margin:0">Tidak ada rekomendasi aktif. Semua dossier terbaca.</p>
				{/if}
			</div>
			<div class="telemetry-card">
				<div class="tc-judul">Kesehatan status</div>
				<div class="health-bar">
					<span style="width:{pctSelesai}%;background:#22c55e"></span>
					<span style="width:{Math.round((counts.diproses/ (counts.total||1))*100)}%;background:#2563eb"></span>
					<span style="width:{pctBaru}%;background:#f59e0b"></span>
				</div>
				<div style="display:flex;gap:10px;font-size:11px;color:#64748b;flex-wrap:wrap">
					<span><span style="color:#22c55e">●</span> Selesai {pctSelesai}%</span>
					<span><span style="color:#2563eb">●</span> Diproses {counts.total ? Math.round((counts.diproses/counts.total)*100) : 0}%</span>
					<span><span style="color:#f59e0b">●</span> Baru {pctBaru}%</span>
				</div>
			</div>
			<div class="telemetry-card">
				<div class="tc-judul">Aliran aktivitas <span class="live">live</span></div>
				<div class="audit-stream">
					{#each rows.slice(0, 6) as r}
						<div class="audit-item">
							<span class="dot {r.status === 'selesai' ? 'ok' : r.status === 'baru' ? 'warn' : 'info'}"></span>
							<div>
								<div class="audit-teks">{r.namaResmi} — <b style="font-weight:600">{r.status}</b></div>
								<div class="audit-meta">{r.ticket} · <b>{tanggal(r.createdAt)}</b></div>
							</div>
						</div>
					{:else}
						<p style="font-size:12px;color:#64748b;margin:0">Belum ada aktivitas.</p>
					{/each}
				</div>
			</div>
		</aside>
	</div>
{/if}