import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { briefSubmissions } from '$lib/server/db/schema';
import {
	MB,
	SLOT_BERKAS,
	pesanTerlaluBesar,
	pesanTipeSalah
} from '$lib/brief/berkas';
import { GalatBerkas, batasFormMB, blobSiap, hapusBerkas, maksBerkasMB, simpanBerkas } from '$lib/server/storage';
import type { Actions, PageServerLoad } from './$types';

// Klien perlu tahu apakah berkas diunggah langsung ke Blob dan seberapa besar
// yang benar-benar bisa lewat di lingkungan ini (Vercel memutus body di 4,5MB).
export const load: PageServerLoad = async () => ({
	blobSiap: blobSiap(),
	maksBerkasMB: maksBerkasMB(),
	// Dipakai saat unggahan langsung gagal dan berkas terpaksa ikut formulir.
	batasFormMB: batasFormMB()
});

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function ticket() {
	const t = new Date();
	const p = (n: number) => String(n).padStart(2, '0');
	const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
	return `WB-${t.getFullYear()}${p(t.getMonth() + 1)}${p(t.getDate())}-${rand}`;
}

function str(fd: FormData, k: string) {
	return String(fd.get(k) ?? '').trim();
}

function arr(fd: FormData, k: string): string[] {
	return fd.getAll(k).map(String).filter(Boolean);
}

const hexOk = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v.trim());
function hex(fd: FormData, k: string): string | null {
	const v = str(fd, k).toUpperCase();
	return hexOk(v) ? v : null;
}

/**
 * URL berkas yang sudah diunggah klien langsung ke Vercel Blob (hidden field `blob-<slot>`).
 * Hanya host penyimpanan Blob sendiri yang diterima: field ini datang dari klien,
 * jadi tanpa penjagaan ini siapa pun bisa menempelkan tautan luar lalu admin
 * mengira itu berkas unggahan klien.
 */
const HOST_BLOB = /\.public\.blob\.vercel-storage\.com$/i;
const urlBlob = (fd: FormData, slot: string) =>
	fd
		.getAll(`blob-${slot}`)
		.map(String)
		.filter((u) => {
			try {
				const x = new URL(u);
				return x.protocol === 'https:' && HOST_BLOB.test(x.hostname);
			} catch {
				return false;
			}
		});

const berkasMasuk = (fd: FormData, slot: string, banyak: boolean): File[] => {
	if (banyak) return fd.getAll(slot).filter((f): f is File => f instanceof File && f.size > 0);
	const satu = fd.get(slot);
	return satu instanceof File && satu.size > 0 ? [satu] : [];
};

export const actions: Actions = {
	kirim: async ({ request }) => {
		const fd = await request.formData();
		const d: Record<string, string> = {};
		for (const [k, v] of fd.entries()) if (typeof v === 'string') d[k] = v;

		const galat: Record<string, string> = {};
		if (!d.kontakNama?.trim()) galat.kontakNama = 'Nama lengkap wajib diisi.';
		if (!d.kontakJabatan?.trim()) galat.kontakJabatan = 'Jabatan wajib diisi.';
		if (!d.kontakWa?.trim()) galat.kontakWa = 'Nomor WhatsApp wajib diisi.';
		if (!d.kontakEmail?.trim() || !emailOk(d.kontakEmail)) galat.kontakEmail = 'Email tidak valid.';
		if (!d.namaResmi?.trim()) galat.namaResmi = 'Nama perusahaan wajib diisi.';
		if (!d.bidang?.trim()) galat.bidang = 'Bidang usaha wajib diisi.';
		if (!d.alamatPusat?.trim()) galat.alamatPusat = 'Alamat kantor pusat wajib diisi.';
		if (!d.sejarah?.trim()) galat.sejarah = 'Sejarah singkat wajib diisi.';
		if (!d.visi?.trim()) galat.visi = 'Visi wajib diisi.';
		if (!d.misi?.trim()) galat.misi = 'Misi wajib diisi.';
		if (!d.daftarProduk?.trim()) galat.daftarProduk = 'Daftar produk wajib diisi.';
		if (!d.warnaIdentitas?.trim()) galat.warnaIdentitas = 'Warna identitas wajib diisi.';
		if (!d.gayaDesain?.trim()) galat.gayaDesain = 'Pilih gaya desain.';

		// Batas ukuran & tipe dijaga di sini juga (bukan hanya di browser).
		const batasLingkungan = maksBerkasMB();
		for (const slot of SLOT_BERKAS) {
			const maks = Math.min(slot.maksMB, batasLingkungan);
			for (const f of berkasMasuk(fd, slot.nama, !!slot.banyak)) {
				if (f.size > maks * MB) galat[slot.nama] = pesanTerlaluBesar(slot, f.size, maks);
				else if (f.type && !slot.tipe.includes(f.type)) galat[slot.nama] = pesanTipeSalah(slot);
			}
		}

		if (Object.keys(galat).length) return fail(400, { galat, nilai: d });

		const noTiket = ticket();
		// Berkas yang sudah diunggah langsung ke Blob dikirim sebagai URL; sisanya
		// (pengirim tanpa JS, atau Blob belum dikonfigurasi) disimpan sekarang.
		let logoUrl: string | null = urlBlob(fd, 'logoFile')[0] ?? null;
		let katalogUrl: string | null = urlBlob(fd, 'katalogFile')[0] ?? null;
		let portoUrl: string | null = urlBlob(fd, 'portofolioFile')[0] ?? null;
		let legalUrl: string | null = urlBlob(fd, 'legalitasFile')[0] ?? null;
		const logoKlienUrls: string[] = urlBlob(fd, 'logoKlienFiles');
		const fotoTimUrls: string[] = urlBlob(fd, 'fotoTimFiles');

		const simpan = async (slot: string): Promise<string | null> => {
			const [file] = berkasMasuk(fd, slot, false);
			if (!file) return null;
			try {
				return await simpanBerkas(file, noTiket, slot);
			} catch (e) {
				console.warn('[webco] simpanBerkas gagal:', slot, e);
				galat[slot] =
					e instanceof GalatBerkas
						? e.message
						: 'Berkas gagal disimpan. Coba kirim ulang atau kecilkan berkasnya.';
				return null;
			}
		};
		if (!logoUrl) logoUrl = await simpan('logoFile');
		if (!katalogUrl) katalogUrl = await simpan('katalogFile');
		if (!portoUrl) portoUrl = await simpan('portofolioFile');
		if (!legalUrl) legalUrl = await simpan('legalitasFile');
		for (const f of berkasMasuk(fd, 'logoKlienFiles', true)) {
			try {
				logoKlienUrls.push(await simpanBerkas(f, noTiket, 'logoKlienFiles'));
			} catch {
				galat.logoKlienFiles = 'Sebagian logo klien gagal disimpan. Kirim ulang berkasnya.';
			}
		}
		for (const f of berkasMasuk(fd, 'fotoTimFiles', true)) {
			try {
				fotoTimUrls.push(await simpanBerkas(f, noTiket, 'fotoTimFiles'));
			} catch {
				galat.fotoTimFiles = 'Sebagian foto tim gagal disimpan. Kirim ulang berkasnya.';
			}
		}

		// Berkas sudah terlanjur masuk tetapi dossier batal dibuat: bersihkan lagi.
		if (Object.keys(galat).length) {
			await hapusBerkas(noTiket, [logoUrl, katalogUrl, portoUrl, legalUrl, ...logoKlienUrls, ...fotoTimUrls]);
			return fail(400, { galat, nilai: d });
		}

		try {

			const tahun = d.tahunBerdiri?.trim() ? Number(d.tahunBerdiri) : null;
			await db.insert(briefSubmissions).values({
				ticket: noTiket,
				status: 'baru',
				kontakNama: str(fd, 'kontakNama'),
				kontakJabatan: str(fd, 'kontakJabatan'),
				kontakWa: str(fd, 'kontakWa'),
				kontakEmail: str(fd, 'kontakEmail'),
				namaResmi: str(fd, 'namaResmi'),
				singkatan: str(fd, 'singkatan') || null,
				tagline: str(fd, 'tagline') || null,
				tahunBerdiri: Number.isInteger(tahun) ? tahun : null,
				bidang: str(fd, 'bidang'),
				alamatPusat: str(fd, 'alamatPusat'),
				alamatCabang: str(fd, 'alamatCabang') || null,
				teleponPerusahaan: str(fd, 'teleponPerusahaan') || null,
				emailPerusahaan: str(fd, 'emailPerusahaan') || null,
				logoUrl,
				sejarah: str(fd, 'sejarah') || null,
				visi: str(fd, 'visi') || null,
				misi: str(fd, 'misi') || null,
				coreValues: str(fd, 'coreValues') || null,
				targetMarket: str(fd, 'targetMarket') || null,
				daftarProduk: str(fd, 'daftarProduk') || null,
				usp: str(fd, 'usp') || null,
				katalogUrl,
				klienDaftar: str(fd, 'klienDaftar') || null,
				logoKlienUrls,
				portofolioDesc: str(fd, 'portofolioDesc') || null,
				portofolioFileUrl: portoUrl,
				testimoni: str(fd, 'testimoni') || null,
				anggotaTim: str(fd, 'anggotaTim') || null,
				fotoTimUrls,
				legalitasDesc: str(fd, 'legalitasDesc') || null,
				legalitasFileUrl: legalUrl,
				instagram: str(fd, 'instagram') || null,
				linkedin: str(fd, 'linkedin') || null,
				facebookX: str(fd, 'facebookX') || null,
				youtubeTiktok: str(fd, 'youtubeTiktok') || null,
				warnaIdentitas: str(fd, 'warnaIdentitas') || null,
				warnaHex1: hex(fd, 'warnaHex1'),
				warnaHex2: hex(fd, 'warnaHex2'),
				gayaDesain: str(fd, 'gayaDesain') || null,
				gayaLainnya: str(fd, 'gayaLainnya') || null,
				referensi: str(fd, 'referensi') || null,
				fitur: arr(fd, 'fitur'),
				catatan: str(fd, 'catatan') || null
			});

			return { sukses: true, tiket: noTiket };
		} catch (err) {
			console.error('[webco] gagal simpan briefing:', err);
			return fail(500, {
				galat: { umum: 'Database tidak dapat dihubungi. Periksa koneksi Neon lalu coba lagi.' },
				nilai: d
			});
		}
	}
};
