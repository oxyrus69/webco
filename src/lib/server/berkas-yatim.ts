import { env } from '$env/dynamic/private';
import { v2 as cloudinary } from 'cloudinary';
import { db } from '$lib/server/db/client';
import { briefSubmissions } from '$lib/server/db/schema';
import { bacaTautanCloudinary, cloudinarySiap, pasangCloudinary } from '$lib/server/cloudinary';

/**
 * Pembersih berkas yatim.
 *
 * Berkas klien diunggah ke Cloudinary **sebelum** dossier dikirim (supaya unggahan besar
 * tidak lewat batas body Vercel Functions). Bila pengirim berhenti di tengah jalan, berkasnya
 * sudah ada di wadah tetapi tidak dirujuk dossier mana pun — itulah berkas yatim.
 *
 * Aturan aman (destruktif, jadi sengaja pelit):
 * 1. Hanya menyentuh folder milik kita (`webco/`).
 * 2. Public ID yang dirujuk baris `brief_submissions` mana pun **tidak pernah** dihapus,
 *    tanpa melihat status dossier.
 * 3. Berkas yang lebih muda dari masa tenggang (default 7 hari) dibiarkan — dossier yang
 *    sedang diisi tidak boleh kehilangan lampirannya.
 * 4. Bila daftar rujukan gagal dibaca (Neon mati), tidak ada apa pun yang dihapus: tanpa
 *    daftar itu, semua berkas akan terlihat yatim.
 * 5. Ada batas jumlah hapus per jalan sebagai pengaman radius ledakan.
 */

const AWALAN = 'webco/';
const JENIS_SUMBER = ['image', 'raw'] as const;
const MAKS_HAPUS = 200;
const MAKS_HALAMAN = 20;

export type LaporanBersih = {
	hari: number;
	kering: boolean;
	diperiksa: number;
	terpakai: number;
	yatim: number;
	dihapus: number;
	gagal: number;
	dipotong: boolean;
	contoh: string[];
	catatan?: string;
};

type AsetCloudinary = {
	public_id: string;
	created_at: string;
	resource_type: string;
	bytes: number;
};

/** Masa tenggang berkas yatim, dari `CLOUDINARY_YATIM_HARI` (default 7 hari). */
export function hariTunggu(): number {
	const n = Number(env.CLOUDINARY_YATIM_HARI);
	if (!Number.isFinite(n) || n <= 0) return 7;
	return Math.min(365, Math.floor(n));
}

/** Public ID yang masih dirujuk dossier — kunci keamanan pembersih ini. */
export async function publikIdTerpakai(): Promise<Set<string>> {
	const rows = await db
		.select({
			logoUrl: briefSubmissions.logoUrl,
			katalogUrl: briefSubmissions.katalogUrl,
			portofolioFileUrl: briefSubmissions.portofolioFileUrl,
			legalitasFileUrl: briefSubmissions.legalitasFileUrl,
			logoKlienUrls: briefSubmissions.logoKlienUrls,
			fotoTimUrls: briefSubmissions.fotoTimUrls
		})
		.from(briefSubmissions);

	const terpakai = new Set<string>();
	for (const r of rows) {
		for (const u of [
			r.logoUrl,
			r.katalogUrl,
			r.portofolioFileUrl,
			r.legalitasFileUrl,
			...(r.logoKlienUrls ?? []),
			...(r.fotoTimUrls ?? [])
		]) {
			if (!u) continue;
			const tautan = bacaTautanCloudinary(u);
			if (tautan) terpakai.add(`${tautan.resourceType}:${tautan.publikId}`);
		}
	}
	return terpakai;
}

async function daftarAset(jenis: string): Promise<AsetCloudinary[]> {
	const semua: AsetCloudinary[] = [];
	let kursor: string | undefined;
	for (let halaman = 0; halaman < MAKS_HALAMAN; halaman++) {
		const jawab = (await cloudinary.api.resources({
			type: 'upload',
			resource_type: jenis,
			prefix: AWALAN,
			max_results: 500,
			...(kursor ? { next_cursor: kursor } : {})
		})) as { resources?: AsetCloudinary[]; next_cursor?: string };
		semua.push(...(jawab.resources ?? []));
		kursor = jawab.next_cursor;
		if (!kursor) break;
	}
	return semua;
}

/**
 * Hapus berkas yatim. `kering: true` (bawaan) hanya melaporkan — pakai ini untuk memeriksa
 * lebih dulu sebelum membiarkan cron berjalan sungguhan.
 */
export async function bersihkanBerkasYatim(
	opsi: { hari?: number; kering?: boolean } = {}
): Promise<LaporanBersih> {
	const hari = opsi.hari ?? hariTunggu();
	const kering = opsi.kering ?? true;
	const dasar: LaporanBersih = {
		hari,
		kering,
		diperiksa: 0,
		terpakai: 0,
		yatim: 0,
		dihapus: 0,
		gagal: 0,
		dipotong: false,
		contoh: []
	};

	if (!cloudinarySiap()) {
		return { ...dasar, catatan: 'Cloudinary belum dikonfigurasi — tidak ada yang diperiksa.' };
	}

	// Rujukan lebih dulu: kalau gagal dibaca, jangan hapus apa pun.
	let terpakai: Set<string>;
	try {
		terpakai = await publikIdTerpakai();
	} catch (e) {
		console.error('[webco] pembersih berkas: gagal membaca rujukan dossier:', e);
		return {
			...dasar,
			catatan: 'Daftar rujukan dossier tidak terbaca (database bermasalah) — tidak ada berkas yang dihapus.'
		};
	}
	dasar.terpakai = terpakai.size;

	try {
		pasangCloudinary();
	} catch (e) {
		return { ...dasar, catatan: (e as Error).message };
	}

	const aset: AsetCloudinary[] = [];
	try {
		for (const jenis of JENIS_SUMBER) {
			aset.push(...(await daftarAset(jenis)));
		}
	} catch (e) {
		console.error('[webco] pembersih berkas: gagal membaca daftar aset Cloudinary:', e);
		return { ...dasar, catatan: 'Daftar aset Cloudinary tidak terbaca — tidak ada berkas yang dihapus.' };
	}
	dasar.diperiksa = aset.length;

	const batas = Date.now() - hari * 24 * 60 * 60 * 1000;
	const yatim = aset
		.filter((a) => {
			if (terpakai.has(`${a.resource_type}:${a.public_id}`)) return false;
			const dibuat = new Date(a.created_at).getTime();
			return Number.isFinite(dibuat) ? dibuat < batas : false;
		})
		.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

	dasar.yatim = yatim.length;
	dasar.dipotong = yatim.length > MAKS_HAPUS;
	dasar.contoh = yatim.slice(0, 10).map((a) => a.public_id);
	if (kering) return dasar;

	for (const a of yatim.slice(0, MAKS_HAPUS)) {
		try {
			const hasil = await cloudinary.uploader.destroy(a.public_id, {
				resource_type: a.resource_type,
				invalidate: true
			});
			if (hasil.result === 'ok' || hasil.result === 'not found') dasar.dihapus++;
			else {
				dasar.gagal++;
				console.warn('[webco] pembersih berkas: gagal hapus', a.public_id, hasil.result);
			}
		} catch (e) {
			dasar.gagal++;
			console.warn('[webco] pembersih berkas: galat hapus', a.public_id, e);
		}
	}
	return dasar;
}
