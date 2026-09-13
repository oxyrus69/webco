import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { briefSubmissions } from '$lib/server/db/schema';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Actions } from './$types';

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

async function simpanFile(file: File, folder: string, prefix: string): Promise<string | null> {
	if (!file || file.size === 0) return null;
	const aman = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
	const nama = `${prefix}-${Date.now()}-${aman}`;
	const dir = join(process.cwd(), 'static', 'uploads', folder);
	await mkdir(dir, { recursive: true });
	const buf = Buffer.from(await file.arrayBuffer());
	await writeFile(join(dir, nama), buf);
	return `/uploads/${folder}/${nama}`;
}

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

		const batas = (f: File | null, maxMB: number, nama: string) => {
			if (f && f.size > maxMB * 1024 * 1024)
				galat[nama] = `Ukuran melebihi ${maxMB}MB. Kecilkan lalu unggah ulang.`;
		};
		const logo = fd.get('logoFile') as File | null;
		const katalog = fd.get('katalogFile') as File | null;
		const porto = fd.get('portofolioFile') as File | null;
		const legal = fd.get('legalitasFile') as File | null;
		batas(logo, 5, 'logoFile');
		batas(katalog, 10, 'katalogFile');
		batas(porto, 10, 'portofolioFile');
		batas(legal, 10, 'legalitasFile');
		for (const f of fd.getAll('logoKlienFiles')) batas(f as File, 5, 'logoKlienFiles');
		for (const f of fd.getAll('fotoTimFiles')) batas(f as File, 5, 'fotoTimFiles');

		if (Object.keys(galat).length) return fail(400, { galat, nilai: d });

		const noTiket = ticket();
		try {
			const logoUrl = logo && logo.size ? await simpanFile(logo, noTiket, 'logo') : null;
			const katalogUrl = katalog && katalog.size ? await simpanFile(katalog, noTiket, 'katalog') : null;
			const portoUrl = porto && porto.size ? await simpanFile(porto, noTiket, 'portofolio') : null;
			const legalUrl = legal && legal.size ? await simpanFile(legal, noTiket, 'legalitas') : null;
			const logoKlienUrls: string[] = [];
			for (const f of fd.getAll('logoKlienFiles')) {
				const ff = f as File;
				if (ff.size) { const u = await simpanFile(ff, noTiket, 'klien'); if (u) logoKlienUrls.push(u); }
			}
			const fotoTimUrls: string[] = [];
			for (const f of fd.getAll('fotoTimFiles')) {
				const ff = f as File;
				if (ff.size) { const u = await simpanFile(ff, noTiket, 'tim'); if (u) fotoTimUrls.push(u); }
			}

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
