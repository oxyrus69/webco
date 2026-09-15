import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/client';
import { briefFiles } from '$lib/server/db/schema';
import { del, put } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { namaAman } from '$lib/brief/berkas';
import { cloudinarySiap, hapusCloudinary, keCloudinary, publicIdCloudinary } from '$lib/server/cloudinary';

/**
 * Penyimpanan berkas dossier. Empat lapis, dicoba berurutan:
 * 1. Cloudinary — wadah utama untuk gambar & PDF (CLOUDINARY_URL atau trio CLOUDINARY_*).
 * 2. Vercel Blob — dipakai di produksi bila Blob store dihubungkan (BLOB_READ_WRITE_TOKEN).
 * 3. Folder `static/uploads` — saat dijalankan lokal (`npm run dev`) tanpa Cloudinary/Blob.
 * 4. Neon (kolom `bytea` tabel `brief_files`) — jaring pengaman supaya berkas tidak
 *    pernah hilang diam-diam, walau wadah mana pun belum dikonfigurasi di lingkungan itu.
 */

export function blobSiap(): boolean {
	return !!env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Wadah yang bisa dipakai untuk unggah langsung dari browser (berkas tidak lewat
 * fungsi server, jadi tidak tersangkut batas body 4,5MB milik Vercel). Cloudinary
 * didahulukan; Blob tetap jadi cadangan bila kredensial Cloudinary belum ada.
 */
export function penyimpananLangsung(): 'cloudinary' | 'blob' | null {
	if (cloudinarySiap()) return 'cloudinary';
	if (blobSiap()) return 'blob';
	return null;
}

/**
 * Batas aman bila berkas harus ikut body request formulir (bukan unggah langsung
 * ke wadah): Vercel memutus body fungsi di 4,5MB, Apache/Vite lokal longgar.
 */
export function batasFormMB(): number {
	return env.VERCEL ? 4 : 10;
}

/** Batas per berkas yang benar-benar bisa lewat di lingkungan ini. */
export function maksBerkasMB(): number {
	// Unggahan langsung dari browser tidak melewati fungsi server.
	if (penyimpananLangsung()) return 10;
	return batasFormMB();
}

export class GalatBerkas extends Error {}

type IsiBerkas = { ticket: string; nama: string; tipe: string | null; ukuran: number; isi: Buffer };

async function keBlob(isi: Buffer, pathname: string, tipe: string | null) {
	const hasil = await put(pathname, isi, {
		access: 'public',
		contentType: tipe ?? undefined,
		addRandomSuffix: false,
		token: env.BLOB_READ_WRITE_TOKEN
	});
	return hasil.url;
}

async function keNeon(berkas: IsiBerkas) {
	const rows = await db.insert(briefFiles).values(berkas).returning({ id: briefFiles.id });
	// Nama asli ikut di URL supaya admin melihat nama berkas, bukan deretan id.
	return `/uploads/${rows[0].id}/${namaAman(berkas.nama)}`;
}

async function keLokal(isi: Buffer, ticket: string, nama: string) {
	const dir = join(process.cwd(), 'static', 'uploads', ticket);
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, nama), isi);
	return `/uploads/${ticket}/${nama}`;
}

/**
 * Simpan satu berkas unggahan, kembalikan URL yang bisa dibuka admin.
 * Melempar GalatBerkas bila semua lapis gagal, supaya pengirim diberi tahu
 * dan bisa memulihkan sendiri — bukan berkasnya hilang tanpa kabar.
 */
export async function simpanBerkas(file: File, ticket: string, slot: string): Promise<string> {
	const nama = `${slot}-${Date.now()}-${namaAman(file.name)}`;
	const isi = Buffer.from(await file.arrayBuffer());
	const tipe = file.type || null;
	const dicoba: string[] = [];

	if (cloudinarySiap()) {
		try {
			return await keCloudinary(isi, publicIdCloudinary(ticket, nama));
		} catch (e) {
			dicoba.push('cloudinary: ' + (e as Error).message);
		}
	}
	if (blobSiap()) {
		try {
			return await keBlob(isi, `uploads/${ticket}/${nama}`, tipe);
		} catch (e) {
			dicoba.push('blob: ' + (e as Error).message);
		}
	}
	if (dev) {
		try {
			return await keLokal(isi, ticket, nama);
		} catch (e) {
			dicoba.push('lokal: ' + (e as Error).message);
		}
	}
	try {
		return await keNeon({ ticket, nama, tipe, ukuran: isi.length, isi });
	} catch (e) {
		dicoba.push('neon: ' + (e as Error).message);
	}

	console.error('[webco] simpanBerkas gagal →', dicoba.join(' | '));
	throw new GalatBerkas(
		'Berkas gagal disimpan. Coba kirim ulang; bila tetap gagal, kecilkan berkasnya atau tempel tautan berkas di kolom catatan Bab 08.'
	);
}

/** Hapus semua berkas milik satu tiket: objek Cloudinary, objek Blob, baris Neon, dan folder lokal. */
export async function hapusBerkas(ticket: string, urls: (string | null | undefined)[]) {
	await hapusCloudinary(urls);

	// Hanya tautan Blob yang dikirim ke API Blob; tautan Cloudinary ditangani lapis Cloudinary di atas.
	const blobUrls = urls.filter(
		(u): u is string => !!u && /\.public\.blob\.vercel-storage\.com\//i.test(u)
	);
	if (blobUrls.length && blobSiap()) {
		try {
			await del(blobUrls, { token: env.BLOB_READ_WRITE_TOKEN });
		} catch (e) {
			console.warn('[webco] gagal hapus objek Blob:', e);
		}
	}
	try {
		await db.delete(briefFiles).where(eq(briefFiles.ticket, ticket));
	} catch (e) {
		console.warn('[webco] gagal hapus baris berkas:', e);
	}
	try {
		await rm(join(process.cwd(), 'static', 'uploads', ticket), { recursive: true, force: true });
	} catch {}
}
