<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { STEPS, GAYA_DESAIN, FITUR_LIST, CONTOH } from '$lib/brief/steps';
	import { validateStep } from '$lib/brief/validation';
	import {
		MB,
		SLOT_BERKAS,
		namaAman,
		pesanTerlaluBesar,
		pesanTipeSalah,
		slotBerkas
	} from '$lib/brief/berkas';
	import { kirimKeCloudinary, mintaTandaUnggah } from '$lib/brief/unggah';
	import PratinjauLampiran from '$lib/components/PratinjauLampiran.svelte';
	import { jenisBerkas, type LampiranPilihan } from '$lib/pratinjau';
	import { onDestroy } from 'svelte';

	let { data, form } = $props();

	type Draft = Record<string, string>;
	const KUNCI = 'webco-draf-v1';
	const AWAL: Draft = {
		kontakNama: '', kontakJabatan: '', kontakWa: '', kontakEmail: '',
		namaResmi: '', singkatan: '', tagline: '', tahunBerdiri: '', bidang: '',
		alamatPusat: '', alamatCabang: '', teleponPerusahaan: '', emailPerusahaan: '',
		sejarah: '', visi: '', misi: '', coreValues: '', targetMarket: '',
		daftarProduk: '', usp: '',
		klienDaftar: '', portofolioDesc: '', testimoni: '',
		anggotaTim: '', legalitasDesc: '',
		instagram: '', linkedin: '', facebookX: '', youtubeTiktok: '',
		warnaIdentitas: '', gayaDesain: '', gayaLainnya: '', referensi: '', catatan: '',
		warnaHex1: '#1C2A3A', warnaHex2: '#C49A3C'
	};

	let d = $state<Draft>({ ...AWAL });
	let fitur = $state<string[]>([]);
	let langkah = $state(0);
	let galat = $state<Record<string, string>>({});
	let selesai = $state<boolean[]>(Array(8).fill(false));
	let terkirim = $state(false);
	let galatUmum = $state('');

	/* ---------- Berkas unggahan ----------
	   Wadah utama adalah Cloudinary (gambar & PDF), dengan Vercel Blob sebagai cadangan.
	   Berkas dikirim langsung dari browser ke wadah sehingga ukurannya tidak dibatasi body
	   request fungsi server (4,5MB di Vercel). Kalau wadah belum dikonfigurasi atau
	   unggahan langsung gagal, berkas ikut dikirim bersama formulir dan disimpan di sisi
	   server (Cloudinary/Blob, folder lokal saat dev, Neon sebagai jaring pengaman). */
	type StatusBerkas = 'kosong' | 'mengunggah' | 'siap' | 'lewat-form' | 'gagal';
	type HasilBerkas = {
		status: StatusBerkas;
		/** Tautan yang sudah benar-benar ada di wadah — inilah yang ikut terkirim (hidden field). */
		urls: string[];
		/** Lampiran yang dipilih pengirim, untuk pratinjau sebelum dossier dikirim. */
		lampiran: LampiranPilihan[];
		pesan: string;
		persen: number;
	};
	const KOSONG: HasilBerkas = { status: 'kosong', urls: [], lampiran: [], pesan: '', persen: 0 };

	let berkas = $state<Record<string, HasilBerkas>>({});
	// Versi naik setiap kali pengirim menekan "Ganti berkas" → input dibuat ulang kosong.
	let versiBerkas = $state<Record<string, number>>({});

	const infoBerkas = (slot: string): HasilBerkas => berkas[slot] ?? KOSONG;
	const sudahUnggah = (slot: string) => infoBerkas(slot).urls.length > 0;
	const mengunggah = $derived(SLOT_BERKAS.some((s) => infoBerkas(s.nama).status === 'mengunggah'));
	// Selama ada berkas yang ditolak, dossier tidak boleh dikirim supaya pengirim
	// tidak mengirim dossier tanpa lampiran yang ia kira sudah masuk.
	const berkasGagal = $derived(SLOT_BERKAS.some((s) => infoBerkas(s.nama).status === 'gagal'));
	// Batas efektif di lingkungan ini: jangan menjanjikan 10MB bila server hanya
	// sanggup menerima 4MB (mis. Vercel tanpa Blob).
	const maksSlot = (nama: string) => {
		const s = slotBerkas(nama);
		if (!s) return 0;
		return Math.min(s.maksMB, data?.maksBerkasMB ?? s.maksMB);
	};

	const acak = () =>
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: Math.random().toString(36).slice(2, 12);

	// Cloudinary menolak SVG di jalur unggah bertanda tangan (allowed_formats tidak boleh
	// memuat svg), jadi berkas SVG selalu ikut formulir dan disimpan di sisi server.
	const svgSaja = (f: File) => f.type === 'image/svg+xml' || /\.svg$/i.test(f.name);

	/**
	 * Kirim berkas langsung ke wadah aktif: tanda tangan dari server, berkasnya ke Cloudinary.
	 * Hasilnya sejajar dengan urutan `daftar`; `null` berarti berkas itu ikut formulir
	 * (SVG selalu begitu, begitu pula saat unggahan langsung tidak tersedia).
	 */
	async function keWadah(
		daftar: File[],
		slotNama: string,
		maju: (persen: number) => void
	): Promise<(string | null)[]> {
		const hasil: (string | null)[] = [];
		if (data?.penyimpananLangsung === 'cloudinary') {
			for (const f of daftar) {
				if (svgSaja(f)) {
					hasil.push(null);
					continue;
				}
				const tanda = await mintaTandaUnggah(slotNama, f.name);
				hasil.push(await kirimKeCloudinary(f, tanda, maju));
			}
			return hasil;
		}
		const { upload } = await import('@vercel/blob/client');
		for (const f of daftar) {
			const r = await upload(`uploads/${acak()}/${namaAman(f.name)}`, f, {
				access: 'public',
				handleUploadUrl: '/api/berkas',
				multipart: true,
				onUploadProgress: ({ percentage }) => maju(Math.round(percentage))
			});
			hasil.push(r.url);
		}
		return hasil;
	}

	/** Lepaskan object URL berkas lokal supaya memori browser tidak menumpuk. */
	function lepasLampiran(info: HasilBerkas) {
		for (const l of info.lampiran) if (l.lokal) URL.revokeObjectURL(l.tautan);
	}

	onDestroy(() => {
		for (const info of Object.values(berkas)) lepasLampiran(info);
	});

	async function pilihBerkas(e: Event, slotNama: string) {
		const input = e.currentTarget as HTMLInputElement;
		const slot = slotBerkas(slotNama);
		if (!slot) return;
		const daftar = [...(input.files ?? [])];
		// Pilihan lama dilepas lebih dulu, baik diganti berkas baru maupun dikosongkan.
		lepasLampiran(infoBerkas(slotNama));
		if (!daftar.length) {
			berkas[slotNama] = { ...KOSONG };
			return;
		}

		// Ukuran & tipe diperiksa lebih dulu supaya pesannya muncul sebelum apa pun dikirim.
		const batas = Math.min(slot.maksMB, data?.maksBerkasMB ?? slot.maksMB);
		for (const f of daftar) {
			if (f.size > batas * MB) {
				berkas[slotNama] = { status: 'gagal', urls: [], lampiran: [], pesan: pesanTerlaluBesar(slot, f.size, batas), persen: 0 };
				input.value = '';
				return;
			}
			if (f.type && !slot.tipe.includes(f.type)) {
				berkas[slotNama] = { status: 'gagal', urls: [], lampiran: [], pesan: pesanTipeSalah(slot), persen: 0 };
				input.value = '';
				return;
			}
		}

		// Pratinjau muncul seketika dari berkas di perangkat pengirim; setelah naik ke
		// wadah, tautannya diganti URL wadah supaya thumbnail ikut dikecilkan.
		const lampiran: LampiranPilihan[] = daftar.map((f) => ({
			nama: f.name,
			ukuran: f.size,
			jenis: jenisBerkas(f.name),
			tautan: URL.createObjectURL(f),
			diWadah: false,
			lokal: true
		}));

		if (!data?.penyimpananLangsung) {
			berkas[slotNama] = {
				status: 'lewat-form',
				urls: [],
				lampiran,
				pesan: 'Berkas ini ikut terkirim bersama formulir.',
				persen: 100
			};
			return;
		}

		berkas[slotNama] = {
			status: 'mengunggah',
			urls: [],
			lampiran,
			pesan: daftar.length > 1 ? `Mengunggah ${daftar.length} berkas…` : 'Mengunggah berkas…',
			persen: 0
		};
		const maju = (persen: number) => {
			berkas[slotNama] = { ...infoBerkas(slotNama), persen };
		};
		try {
			const urlsPerBerkas = await keWadah(daftar, slotNama, maju);
			const urls: string[] = [];
			const tampil = lampiran.map((l, i) => {
				const url = urlsPerBerkas[i];
				if (!url) return l; // tetap dikirim bersama formulir → pratinjau lokal dibiarkan
				urls.push(url);
				if (l.lokal) URL.revokeObjectURL(l.tautan);
				return { ...l, tautan: url, diWadah: true, lokal: false };
			});
			const lewatForm = daftar.length - urls.length;
			if (!urls.length) {
				// Seluruh berkas ikut formulir (mis. semua SVG): input tetap memegang berkasnya.
				berkas[slotNama] = {
					status: 'lewat-form',
					urls: [],
					lampiran: tampil,
					pesan: 'Berkas SVG ikut terkirim bersama formulir.',
					persen: 100
				};
				return;
			}
			const pesan = urls.length > 1 ? `${urls.length} berkas siap ikut terkirim.` : 'Berkas siap ikut terkirim.';
			berkas[slotNama] = {
				status: 'siap',
				urls,
				lampiran: tampil,
				pesan: lewatForm ? `${pesan} ${lewatForm} berkas SVG ikut bersama formulir.` : pesan,
				persen: 100
			};
		} catch (err) {
			console.warn('[webco] unggah langsung gagal, berkas dikirim lewat formulir:', err);
			// Berkas yang ikut formulir harus muat di body request server; kalau tidak,
			// tolak sekarang dengan pesan yang jelas — jangan biarkan server memutusnya
			// diam-diam saat pengiriman.
			const batasForm = data?.batasFormMB ?? 10;
			const kebesaran = daftar.find((f) => f.size > batasForm * MB);
			if (kebesaran) {
				berkas[slotNama] = {
					status: 'gagal',
					urls: [],
					// Tidak dipratinjau: berkas ini memang tidak akan dikirim sampai dikecilkan.
					lampiran: [],
					pesan: pesanTerlaluBesar(slot, kebesaran.size, batasForm),
					persen: 0
				};
				return;
			}
			berkas[slotNama] = {
				status: 'lewat-form',
				urls: [],
				lampiran,
				pesan:
					'Unggahan langsung tidak tersedia — berkas akan dikirim bersama formulir. Bila pengiriman ditolak, kecilkan berkasnya lalu coba lagi.',
				persen: 0
			};
		}
	}

	function gantiBerkas(slotNama: string) {
		lepasLampiran(infoBerkas(slotNama));
		berkas[slotNama] = { ...KOSONG };
		versiBerkas[slotNama] = (versiBerkas[slotNama] ?? 0) + 1;
	}

	const berkasTerlampir = $derived(
		SLOT_BERKAS.map((s) => ({ slot: s, info: infoBerkas(s.nama) })).filter(
			({ info }) => info.status !== 'kosong'
		)
	);

	if (browser) {
		try {
			const raw = localStorage.getItem(KUNCI);
			if (raw) {
				const p = JSON.parse(raw);
				d = { ...AWAL, ...(p.d ?? {}) };
				fitur = p.fitur ?? [];
				if (Array.isArray(p.selesai)) selesai = p.selesai;
			}
		} catch {}
	}
	const masuk = $derived(form);
	$effect(() => {
		if (masuk?.nilai) d = { ...d, ...masuk.nilai };
		if (masuk?.galat) galat = masuk.galat;
	});

	$effect(() => {
		if (!browser || terkirim) return;
		try { localStorage.setItem(KUNCI, JSON.stringify({ d, fitur, selesai })); } catch {}
	});

	const persen = $derived(Math.round((selesai.filter(Boolean).length / 8) * 100));
	const serverGalat = $derived((form?.galat ?? {}) as Record<string, string>);

	function ke(i: number) {
		galat = {};
		langkah = i;
		if (browser) document.getElementById('lembar-atas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
	function lanjut() {
		const e = validateStep(langkah, d);
		if (Object.keys(e).length) { galat = e; return; }
		const n = [...selesai]; n[langkah] = true; selesai = n;
		if (langkah < 8) ke(langkah + 1);
	}
	function kembali() { if (langkah > 0) ke(langkah - 1); }
	function hapusDraf() {
		if (browser) localStorage.removeItem(KUNCI);
		d = { ...AWAL }; fitur = []; selesai = Array(8).fill(false); langkah = 0; galat = {};
	}

	const FIELD_LABEL: Record<string, string> = {
		kontakNama: 'Nama lengkap', kontakJabatan: 'Jabatan', kontakWa: 'Telepon / WA',
		kontakEmail: 'Email', namaResmi: 'Nama perusahaan', bidang: 'Bidang usaha',
		alamatPusat: 'Alamat kantor pusat', sejarah: 'Sejarah', visi: 'Visi', misi: 'Misi',
		daftarProduk: 'Daftar produk', warnaIdentitas: 'Warna identitas', gayaDesain: 'Gaya desain',
		gayaLainnya: 'Gaya lainnya', tahunBerdiri: 'Tahun berdiri',
		teleponPerusahaan: 'Telepon perusahaan', emailPerusahaan: 'Email perusahaan',
		logoFile: 'Logo perusahaan'
	};
	const semuaGalat = $derived({ ...serverGalat, ...galat } as Record<string, string>);
	const kunciGalat = $derived(Object.keys(semuaGalat).filter((k) => k !== 'umum'));
	const pesanUmum = $derived(galatUmum || semuaGalat.umum || '');
</script>

<svelte:head><title>Isi Briefing — WebCo.</title></svelte:head>

{#snippet catatanBerkas(slot: string)}
	{#if infoBerkas(slot).status === 'mengunggah'}
		<div class="berkas-maju" aria-hidden="true"><i style="width: {infoBerkas(slot).persen}%"></i></div>
	{/if}
	<PratinjauLampiran daftar={infoBerkas(slot).lampiran} />
	{#if infoBerkas(slot).pesan}
		<p
			class="berkas-pesan"
			class:siap={infoBerkas(slot).status === 'siap' || infoBerkas(slot).status === 'lewat-form'}
			class:galat={infoBerkas(slot).status === 'gagal'}
			aria-live="polite"
		>{infoBerkas(slot).pesan}</p>
	{/if}
	{#if sudahUnggah(slot)}
		<button type="button" class="btn btn-kedua btn-kecil" onclick={() => gantiBerkas(slot)}>Ganti berkas</button>
	{:else if infoBerkas(slot).status === 'gagal'}
		<button type="button" class="btn btn-kedua btn-kecil" onclick={() => gantiBerkas(slot)}>Kosongkan berkas</button>
	{/if}
{/snippet}

<div class="workspace">
	<div class="wrap">
		<h1 class="sr-only">Isi dossier briefing WebCo.</h1>
		<p class="crumb">
			<a href="/">Beranda</a> / Dossier briefing
		</p>
		<div class="dossier-grid">
			<aside class="navigator" aria-label="Daftar 8 bab">
				<h2>DOSSIER · 8 BAB</h2>
				<ol class="nav-bab">
					{#each STEPS as s, i}
						<li>
							<button type="button" class:aktif={langkah === i} onclick={() => ke(i)} aria-current={langkah === i ? 'step' : undefined}>
								<span class="no">{s.no}</span>
								<span><span class="nama">{s.judul}</span><br /><span class="sub">{s.sub}</span></span>
								<span class="centang">{selesai[i] ? '✓' : s.wajib ? '' : '○'}</span>
							</button>
						</li>
					{/each}
					<li>
						<button type="button" class:aktif={langkah === 8} onclick={() => ke(8)}>
							<span class="no">✓</span>
							<span><span class="nama">Periksa & kirim</span><br /><span class="sub">Ringkasan sebelum dikirim</span></span>
							<span class="centang"></span>
						</button>
					</li>
				</ol>
				<div class="kemajuan" aria-hidden="true"><i style="width: {persen}%"></i></div>
				<p class="kemajuan-teks" aria-live="polite">{persen}% bab wajib tuntas</p>
			</aside>

			<div class="lembar" id="lembar-atas">
				<form method="POST" action="?/kirim" enctype="multipart/form-data" use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success' && (result.data as any)?.sukses) {
							terkirim = true;
							if (browser) localStorage.removeItem(KUNCI);
							await goto(`/brief/sukses?tiket=${(result.data as any).tiket}`);
							return;
						}
						if (result.type === 'failure') {
							galat = (result.data as any)?.galat ?? {};
							galatUmum = galat.umum ?? '';
							await update();
							document.getElementById('lembar-atas')?.scrollIntoView({ block: 'start' });
							return;
						}
						await update();
					};
				}}>
					<!-- URL berkas yang sudah diunggah langsung ke Vercel Blob dari browser -->
					{#each SLOT_BERKAS as sb}
						{#each infoBerkas(sb.nama).urls as u}
							<input type="hidden" name={`blob-${sb.nama}`} value={u} />
						{/each}
					{/each}

					<!-- hidden fitur checkboxes are real inputs below; keep ticket-agnostic -->
					{#if langkah < 8}
						{@const s = STEPS[langkah]}
						{#key langkah}
						<div class="lembar-kepala masuk-bab">
							<span class="no">BAB {s.no} / 08</span>
							<div><h2>{s.judul}</h2><p>{s.sub} · {s.wajib ? 'Wajib diisi' : 'Boleh dikosongkan'}</p></div>
						</div>
						{/key}
					{:else}
						<div class="lembar-kepala">
							<span class="no">SELESAI / KIRIM</span>
							<div><h2>Periksa ringkasan dossier</h2><p>Betulkan per bab bila ada yang keliru, lalu kirim sekali.</p></div>
						</div>
					{/if}

					{#if pesanUmum || kunciGalat.length}
						<div class="kotak-galat" role="alert">
							<h2>Ada yang perlu dibetulkan sebelum lanjut</h2>
							{#if pesanUmum}<p style="margin: 0 0 8px">{pesanUmum}</p>{/if}
							{#if kunciGalat.length}
								<ul>
									{#each kunciGalat as k}
										<li><a href="#{k}">{FIELD_LABEL[k] ?? k} — {semuaGalat[k]}</a></li>
									{/each}
								</ul>
							{/if}
						</div>
					{/if}

					<!-- BAB 01 -->
					<div hidden={langkah !== 0}>
						<div class="medan-dua">
							<div class="medan" class:invalid={galat.kontakNama || serverGalat.kontakNama}>
								<label for="kontakNama">Nama lengkap</label>
								<input id="kontakNama" name="kontakNama" type="text" autocomplete="name" placeholder={CONTOH.kontakNama} bind:value={d.kontakNama} />
								{#if galat.kontakNama || serverGalat.kontakNama}<span class="galat">{galat.kontakNama ?? serverGalat.kontakNama}</span>{/if}
							</div>
							<div class="medan" class:invalid={galat.kontakJabatan}>
								<label for="kontakJabatan">Jabatan</label>
								<input id="kontakJabatan" name="kontakJabatan" type="text" placeholder="cth: Marketing Manager" bind:value={d.kontakJabatan} />
								{#if galat.kontakJabatan}<span class="galat">{galat.kontakJabatan}</span>{/if}
							</div>
						</div>
						<div class="medan-dua">
							<div class="medan" class:invalid={galat.kontakWa}>
								<label for="kontakWa">Nomor telepon / WhatsApp</label>
								<input id="kontakWa" name="kontakWa" type="text" inputmode="tel" autocomplete="tel" placeholder="cth: 0812-3456-7890" bind:value={d.kontakWa} />
								{#if galat.kontakWa}<span class="galat">{galat.kontakWa}</span>{/if}
							</div>
							<div class="medan" class:invalid={galat.kontakEmail}>
								<label for="kontakEmail">Alamat email</label>
								<input id="kontakEmail" name="kontakEmail" type="email" autocomplete="email" placeholder="cth: ratna@perusahaan.id" bind:value={d.kontakEmail} />
								{#if galat.kontakEmail}<span class="galat">{galat.kontakEmail}</span>{/if}
							</div>
						</div>
					</div>

					<!-- BAB 02 -->
					<div hidden={langkah !== 1}>
						<div class="medan-dua">
							<div class="medan" class:invalid={galat.namaResmi}>
								<label for="namaResmi">Nama perusahaan (resmi & singkatan)</label>
								<input id="namaResmi" name="namaResmi" type="text" placeholder="cth: PT Maju Baja Abadi" bind:value={d.namaResmi} />
								{#if galat.namaResmi}<span class="galat">{galat.namaResmi}</span>{/if}
							</div>
							<div class="medan">
								<label for="singkatan">Singkatan <span class="ops">opsional</span></label>
								<input id="singkatan" name="singkatan" type="text" placeholder="cth: MBA" bind:value={d.singkatan} />
							</div>
						</div>
						<div class="medan-dua">
							<div class="medan">
								<label for="tagline">Tagline / slogan <span class="ops">opsional</span></label>
								<input id="tagline" name="tagline" type="text" placeholder="cth: Atap kuat, hati tenang" bind:value={d.tagline} />
							</div>
							<div class="medan-dua">
								<div class="medan" class:invalid={galat.tahunBerdiri}>
									<label for="tahunBerdiri">Tahun berdiri</label>
									<input id="tahunBerdiri" name="tahunBerdiri" type="number" min="1800" max="2026" placeholder="cth: 2014" bind:value={d.tahunBerdiri} />
									{#if galat.tahunBerdiri}<span class="galat">{galat.tahunBerdiri}</span>{/if}
								</div>
								<div class="medan" class:invalid={galat.bidang}>
									<label for="bidang">Bidang industri</label>
									<input id="bidang" name="bidang" type="text" placeholder={CONTOH.bidang} bind:value={d.bidang} />
									{#if galat.bidang}<span class="galat">{galat.bidang}</span>{/if}
								</div>
							</div>
						</div>
						<div class="medan" class:invalid={galat.alamatPusat}>
							<label for="alamatPusat">Alamat lengkap kantor pusat</label>
							<textarea id="alamatPusat" name="alamatPusat" placeholder={CONTOH.alamatPusat} bind:value={d.alamatPusat}></textarea>
							{#if galat.alamatPusat}<span class="galat">{galat.alamatPusat}</span>{/if}
						</div>
						<div class="medan">
							<label for="alamatCabang">Alamat kantor cabang <span class="ops">jika ada</span></label>
							<textarea id="alamatCabang" name="alamatCabang" style="min-height:70px" placeholder="cth: Ruko Taman Palem Blok C-9, Jakarta Barat" bind:value={d.alamatCabang}></textarea>
						</div>
						<div class="medan-dua">
							<div class="medan" class:invalid={galat.teleponPerusahaan}>
								<label for="teleponPerusahaan">Nomor telepon perusahaan</label>
								<input id="teleponPerusahaan" name="teleponPerusahaan" type="text" placeholder="cth: (022) 420-8899" bind:value={d.teleponPerusahaan} />
								{#if galat.teleponPerusahaan}<span class="galat">{galat.teleponPerusahaan}</span>{/if}
							</div>
							<div class="medan" class:invalid={galat.emailPerusahaan}>
								<label for="emailPerusahaan">Email resmi perusahaan</label>
								<input id="emailPerusahaan" name="emailPerusahaan" type="email" placeholder="cth: halo@perusahaan.id" bind:value={d.emailPerusahaan} />
								{#if galat.emailPerusahaan}<span class="galat">{galat.emailPerusahaan}</span>{/if}
							</div>
						</div>
						<div class="medan" class:invalid={galat.logoFile || serverGalat.logoFile}>
							<label for="logoFile">Logo perusahaan <span class="ops">PNG / SVG / WebP, maks {maksSlot('logoFile')}MB</span></label>
							<div class="unggah">
								{#key versiBerkas.logoFile ?? 0}
									<input
										id="logoFile"
										name="logoFile"
										type="file"
										accept=".png,.svg,.webp,.jpg,.jpeg"
										onchange={(e) => pilihBerkas(e, 'logoFile')}
										disabled={sudahUnggah('logoFile')}
									/>
								{/key}
								<div class="meta">Gunakan resolusi tertinggi yang Anda punya. Bila belum ada logo, kosongkan.</div>
								{@render catatanBerkas('logoFile')}
							</div>
							{#if serverGalat.logoFile}<span class="galat">{serverGalat.logoFile}</span>{/if}
						</div>
					</div>

					<!-- BAB 03 -->
					<div hidden={langkah !== 2}>
						<div class="medan" class:invalid={galat.sejarah}>
							<label for="sejarah">Sejarah singkat perusahaan</label>
							<span class="contoh">Tulis 3–5 kalimat: kapan berdiri, oleh siapa, tonggak penting.</span>
							<textarea id="sejarah" name="sejarah" placeholder="cth: Berdiri 2014 di Bandung oleh dua insinyur sipil. Awalnya toko bahan bangunan, kini melayani 300 kontraktor di Jawa Barat." bind:value={d.sejarah}></textarea>
							{#if galat.sejarah}<span class="galat">{galat.sejarah}</span>{/if}
						</div>
						<div class="medan" class:invalid={galat.visi}>
							<label for="visi">Visi perusahaan</label>
							<textarea id="visi" name="visi" style="min-height:80px" bind:value={d.visi}></textarea>
							{#if galat.visi}<span class="galat">{galat.visi}</span>{/if}
						</div>
						<div class="medan" class:invalid={galat.misi}>
							<label for="misi">Misi perusahaan</label>
							<textarea id="misi" name="misi" style="min-height:80px" bind:value={d.misi}></textarea>
							{#if galat.misi}<span class="galat">{galat.misi}</span>{/if}
						</div>
						<div class="medan">
							<label for="coreValues">Nilai-nilai inti <span class="ops">satu per baris</span></label>
							<textarea id="coreValues" name="coreValues" style="min-height:80px" placeholder="cth: Jujur soal bahan. Tepat waktu. Garansi tertulis." bind:value={d.coreValues}></textarea>
						</div>
						<div class="medan">
							<label for="targetMarket">Target market / audiens utama</label>
							<span class="contoh">{CONTOH.targetMarket}</span>
							<textarea id="targetMarket" name="targetMarket" style="min-height:80px" bind:value={d.targetMarket}></textarea>
						</div>
					</div>

					<!-- BAB 04 -->
					<div hidden={langkah !== 3}>
						<div class="medan" class:invalid={galat.daftarProduk}>
							<label for="daftarProduk">Daftar produk / layanan utama</label>
							<span class="contoh">{CONTOH.daftarProduk}</span>
							<textarea id="daftarProduk" name="daftarProduk" style="min-height:130px" bind:value={d.daftarProduk}></textarea>
							{#if galat.daftarProduk}<span class="galat">{galat.daftarProduk}</span>{/if}
						</div>
						<div class="medan">
							<label for="usp">Keunggulan dibanding kompetitor</label>
							<span class="contoh">{CONTOH.usp}</span>
							<textarea id="usp" name="usp" bind:value={d.usp}></textarea>
						</div>
						<div class="medan">
							<label for="katalogFile">Katalog / brosur <span class="ops">PDF, maks {maksSlot('katalogFile')}MB</span></label>
							<div class="unggah">
								{#key versiBerkas.katalogFile ?? 0}
									<input id="katalogFile" name="katalogFile" type="file" accept=".pdf" onchange={(e) => pilihBerkas(e, 'katalogFile')} disabled={sudahUnggah('katalogFile')} />
								{/key}
								<div class="meta">Bila tidak ada, kosongkan.</div>
								{@render catatanBerkas('katalogFile')}
							</div>
						</div>
					</div>

					<!-- BAB 05 -->
					<div hidden={langkah !== 4}>
						<div class="medan">
							<label for="klienDaftar">Daftar klien / mitra utama <span class="ops">opsional</span></label>
							<textarea id="klienDaftar" name="klienDaftar" placeholder="cth: PT Waskita Beton, Dinas PU Kota Bandung, Hotel Amaris." bind:value={d.klienDaftar}></textarea>
						</div>
						<div class="medan">
							<label for="logoKlienFiles">Logo klien / mitra <span class="ops">boleh lebih dari satu, maks {maksSlot('logoKlienFiles')}MB per file</span></label>
							<div class="unggah">
								{#key versiBerkas.logoKlienFiles ?? 0}
									<input id="logoKlienFiles" name="logoKlienFiles" type="file" multiple accept=".png,.svg,.webp,.jpg,.jpeg" onchange={(e) => pilihBerkas(e, 'logoKlienFiles')} disabled={sudahUnggah('logoKlienFiles')} />
								{/key}
								{@render catatanBerkas('logoKlienFiles')}
							</div>
						</div>
						<div class="medan">
							<label for="portofolioDesc">Proyek unggulan <span class="ops">opsional</span></label>
							<textarea id="portofolioDesc" name="portofolioDesc" placeholder="cth: 2023 — Atap GOR Soreang 4.200 m², selesai 45 hari." bind:value={d.portofolioDesc}></textarea>
						</div>
						<div class="medan">
							<label for="portofolioFile">Berkas portofolio <span class="ops">PDF/gambar, maks {maksSlot('portofolioFile')}MB</span></label>
							<div class="unggah">
								{#key versiBerkas.portofolioFile ?? 0}
									<input id="portofolioFile" name="portofolioFile" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onchange={(e) => pilihBerkas(e, 'portofolioFile')} disabled={sudahUnggah('portofolioFile')} />
								{/key}
								{@render catatanBerkas('portofolioFile')}
							</div>
						</div>
						<div class="medan">
							<label for="testimoni">Testimoni pelanggan <span class="ops">sertakan nama dan jabatan</span></label>
							<textarea id="testimoni" name="testimoni" placeholder='cth: "Pengerjaan rapi dan tepat waktu." — H. Bambang, Direktur PT Waskita Beton' bind:value={d.testimoni}></textarea>
						</div>
					</div>

					<!-- BAB 06 -->
					<div hidden={langkah !== 5}>
						<div class="medan">
							<label for="anggotaTim">Anggota tim utama <span class="ops">opsional — nama & jabatan, satu per baris</span></label>
							<textarea id="anggotaTim" name="anggotaTim" placeholder="cth: Ir. Dedi Kurnia — Direktur Utama. Sari Lestari — Kepala Operasional." bind:value={d.anggotaTim}></textarea>
						</div>
						<div class="medan">
							<label for="fotoTimFiles">Foto anggota tim <span class="ops">boleh lebih dari satu, maks {maksSlot('fotoTimFiles')}MB per file</span></label>
							<div class="unggah">
								{#key versiBerkas.fotoTimFiles ?? 0}
									<input id="fotoTimFiles" name="fotoTimFiles" type="file" multiple accept=".jpg,.jpeg,.png,.webp" onchange={(e) => pilihBerkas(e, 'fotoTimFiles')} disabled={sudahUnggah('fotoTimFiles')} />
								{/key}
								{@render catatanBerkas('fotoTimFiles')}
							</div>
						</div>
						<div class="medan">
							<label for="legalitasDesc">Sertifikasi / penghargaan / legalitas <span class="ops">cth: ISO 9001, Halal MUI</span></label>
							<textarea id="legalitasDesc" name="legalitasDesc" style="min-height:80px" bind:value={d.legalitasDesc}></textarea>
						</div>
						<div class="medan">
							<label for="legalitasFile">Berkas sertifikasi <span class="ops">PDF/gambar, maks {maksSlot('legalitasFile')}MB</span></label>
							<div class="unggah">
								{#key versiBerkas.legalitasFile ?? 0}
									<input id="legalitasFile" name="legalitasFile" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onchange={(e) => pilihBerkas(e, 'legalitasFile')} disabled={sudahUnggah('legalitasFile')} />
								{/key}
								{@render catatanBerkas('legalitasFile')}
							</div>
						</div>
					</div>

					<!-- BAB 07 -->
					<div hidden={langkah !== 6}>
						<div class="medan-dua">
							<div class="medan"><label for="instagram">Link Instagram</label><input id="instagram" name="instagram" type="url" inputmode="url" placeholder="https://instagram.com/…" bind:value={d.instagram} /></div>
							<div class="medan"><label for="linkedin">Link LinkedIn</label><input id="linkedin" name="linkedin" type="url" inputmode="url" placeholder="https://linkedin.com/company/…" bind:value={d.linkedin} /></div>
						</div>
						<div class="medan-dua">
							<div class="medan"><label for="facebookX">Link Facebook / X</label><input id="facebookX" name="facebookX" type="url" inputmode="url" placeholder="https://facebook.com/… atau https://x.com/…" bind:value={d.facebookX} /></div>
							<div class="medan"><label for="youtubeTiktok">Link YouTube / TikTok</label><input id="youtubeTiktok" name="youtubeTiktok" type="url" inputmode="url" placeholder="https://youtube.com/@… atau https://tiktok.com/@…" bind:value={d.youtubeTiktok} /></div>
						</div>
					</div>

					<!-- BAB 08 -->
					<div hidden={langkah !== 7}>
						<div class="medan" class:invalid={galat.warnaIdentitas}>
							<label for="warnaIdentitas">Warna dominan / identitas yang diinginkan</label>
							<input id="warnaIdentitas" name="warnaIdentitas" type="text" placeholder="cth: Biru dongker dan emas" bind:value={d.warnaIdentitas} />
							{#if galat.warnaIdentitas}<span class="galat">{galat.warnaIdentitas}</span>{/if}
						</div>
						<div class="medan">
							<fieldset style="border:0;margin:0;padding:0"><legend class="legenda">Kode warna identitas</legend>
							<div class="pemilih-warna">
								<label class="contoh-warna" for="warnaHex1">
									<input id="warnaHex1" name="warnaHex1" type="color" bind:value={d.warnaHex1} />
									<span><b>Warna utama</b><span class="hex">{d.warnaHex1.toUpperCase()}</span></span>
								</label>
								<label class="contoh-warna" for="warnaHex2">
									<input id="warnaHex2" name="warnaHex2" type="color" bind:value={d.warnaHex2} />
									<span><b>Warna pendamping</b><span class="hex">{d.warnaHex2.toUpperCase()}</span></span>
								</label>
							</div>
							</fieldset>
						</div>
						<div class="medan" class:invalid={galat.gayaDesain}>
							<fieldset style="border:0;margin:0;padding:0" id="gayaDesain"><legend class="legenda">Gaya desain yang disukai</legend>
							<div class="pilihan" role="radiogroup" aria-label="Gaya desain">
								{#each GAYA_DESAIN as g}
									<label class="kartu-pilih" class:terpilih={d.gayaDesain === g}>
										<input type="radio" name="gayaDesain" value={g} bind:group={d.gayaDesain} /> 
										<span><b>{g}</b>{g === 'Lainnya' ? ' — tulis di kolom bawah.' : ''}</span>
									</label>
								{/each}
							</div>
							{#if galat.gayaDesain}<span class="galat">{galat.gayaDesain}</span>{/if}
							</fieldset>
						</div>
						{#if d.gayaDesain === 'Lainnya'}
							<div class="medan" class:invalid={galat.gayaLainnya}>
								<label for="gayaLainnya">Jelaskan gaya lainnya</label>
								<input id="gayaLainnya" name="gayaLainnya" type="text" placeholder="cth: Gaya majalah arsitektur, banyak foto besar" bind:value={d.gayaLainnya} />
								{#if galat.gayaLainnya}<span class="galat">{galat.gayaLainnya}</span>{/if}
							</div>
						{:else}
							<input type="hidden" name="gayaLainnya" value={d.gayaLainnya} />
						{/if}
						<div class="medan">
							<label for="referensi">2–3 link website referensi yang Anda sukai</label>
							<span class="contoh">{CONTOH.referensi}</span>
							<textarea id="referensi" name="referensi" bind:value={d.referensi}></textarea>
						</div>
						<div class="medan">
							<fieldset style="border:0;margin:0;padding:0"><legend class="legenda">Fitur tambahan yang dibutuhkan</legend>
							<div class="fitur-grid">
								{#each FITUR_LIST as f}
									<label class:terpilih={fitur.includes(f.id)}>
										<input type="checkbox" name="fitur" value={f.id} bind:group={fitur} />
										<span><b>{f.label}</b><br /><span class="fitur-desc">{f.desc}</span></span>
									</label>
								{/each}
							</div>
							</fieldset>
						</div>
						<div class="medan">
							<label for="catatan">Catatan tambahan untuk tim developer</label>
							<textarea id="catatan" name="catatan" placeholder="cth: Deadline tayang sebelum pameran 20 Desember. Admin website cukup 1 orang." bind:value={d.catatan}></textarea>
						</div>
					</div>

					<!-- REVIEW -->
					<div hidden={langkah !== 8}>
						{#each STEPS as s, i}
							<div class="ringkasan-bab">
								<h3><span class="ringkas-no">{s.no}</span> · {s.judul}</h3>
								<dl>
									{#if i === 0}
										<dt>Kontak</dt><dd>{d.kontakNama} — {d.kontakJabatan} · {d.kontakWa} · {d.kontakEmail}</dd>
									{:else if i === 1}
										<dt>Perusahaan</dt><dd>{d.namaResmi}{d.singkatan ? ` (${d.singkatan})` : ''} · {d.bidang} · {d.tahunBerdiri || '—'}</dd>
										<dt>Alamat</dt><dd>{d.alamatPusat || '—'}</dd>
									{:else if i === 2}
										<dt>Sejarah</dt><dd>{(d.sejarah || '—').slice(0, 220)}</dd>
									{:else if i === 3}
										<dt>Produk</dt><dd>{(d.daftarProduk || '—').slice(0, 220)}</dd>
									{:else if i === 7}
										<dt>Desain</dt><dd>{d.warnaIdentitas || '—'} · {d.gayaDesain || '—'} · Fitur: {fitur.join(', ') || '—'}</dd>
										<dt>Kode hex</dt><dd><span class="baris-hex"><input class="swatch" type="color" value={d.warnaHex1} disabled aria-hidden="true" /><span class="hex">{d.warnaHex1.toUpperCase()}</span><input class="swatch" type="color" value={d.warnaHex2} disabled aria-hidden="true" /><span class="hex">{d.warnaHex2.toUpperCase()}</span></span></dd>
									{:else}
										<dt>Ringkasan</dt><dd>{s.wajib ? 'Terisi (periksa kembali di bab terkait).' : 'Opsional — kosong tidak apa-apa.'}</dd>
									{/if}
								</dl>
								<button type="button" class="btn btn-kedua btn-kecil" style="margin-top:10px" onclick={() => ke(i)}>Betulkan bab {s.no}</button>
							</div>
						{/each}
						{#if berkasTerlampir.length}
							<div class="ringkasan-bab">
								<h3>Berkas yang ikut terkirim</h3>
								<ul class="daftar-berkas">
									{#each berkasTerlampir as b}
									<li>
										<b>{b.slot.label}</b> — {b.info.status === 'siap'
											? 'sudah diunggah'
											: b.info.status === 'mengunggah'
												? 'sedang diunggah…'
												: b.info.status === 'gagal'
													? 'gagal — periksa pesan di bab terkait'
													: 'dikirim bersama formulir'}
										<PratinjauLampiran daftar={b.info.lampiran} lebar={150} tinggi={92} />
									</li>
									{/each}
								</ul>
							</div>
						{/if}
						<p class="persetujuan">Dengan menekan Kirim dossier, Anda setuju dihubungi WebCo. melalui kontak di Bab 01.</p>
					</div>

					<div class="navigasi-bab">
						<div style="display:flex;gap:10px">
							{#if langkah > 0}<button type="button" class="btn btn-kedua" onclick={kembali}>Kembali</button>{/if}
							{#if langkah < 8}<button type="button" class="btn btn-kedua btn-kecil" onclick={hapusDraf}>Hapus draf</button>{/if}
						</div>
						<div>
							{#if langkah < 8}<button type="button" class="btn btn-primer" onclick={lanjut}>{langkah === 7 ? 'Periksa ringkasan' : 'Lanjut'}</button>{/if}
							{#if langkah === 8}<button type="submit" class="btn btn-primer" disabled={mengunggah || berkasGagal}>Kirim dossier</button>{/if}
						</div>
					</div>
					{#if mengunggah}
						<p class="draf-info" aria-live="polite">Menunggu berkas selesai diunggah sebelum mengirim…</p>
					{/if}
					{#if berkasGagal}
						<p class="draf-info galat" aria-live="polite">
							Ada berkas yang ditolak. Perbaiki atau kosongkan berkas itu di bab terkait sebelum
							mengirim dossier.
						</p>
					{/if}
					<p class="draf-info">Draf tersimpan otomatis di perangkat ini · <b>{persen}% tuntas</b></p>
				</form>
			</div>
		</div>
	</div>
</div>
