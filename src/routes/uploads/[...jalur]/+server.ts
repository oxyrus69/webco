import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { briefFiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { namaAman } from '$lib/brief/berkas';
import type { RequestHandler } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Berkas yang tersimpan di Neon (lapis cadangan saat Vercel Blob belum aktif).
// URL-nya /uploads/<id>/<nama-asli> supaya admin melihat nama berkasnya.
export const GET: RequestHandler = async ({ params }) => {
	const id = (params.jalur ?? '').split('/')[0];
	if (!UUID.test(id)) throw error(404, 'Berkas tidak ditemukan.');

	let rows;
	try {
		rows = await db
			.select({ nama: briefFiles.nama, tipe: briefFiles.tipe, isi: briefFiles.isi })
			.from(briefFiles)
			.where(eq(briefFiles.id, id))
			.limit(1);
	} catch (e) {
		console.error('[webco] gagal membaca berkas:', e);
		throw error(503, 'Penyimpanan berkas sedang tidak tersedia. Coba lagi sebentar lagi.');
	}

	const row = rows[0];
	if (!row) throw error(404, 'Berkas tidak ditemukan.');

	const gambar = (row.tipe ?? '').startsWith('image/');
	return new Response(new Uint8Array(row.isi), {
		headers: {
			'content-type': row.tipe || 'application/octet-stream',
			'content-length': String(row.isi.length),
			'content-disposition': `${gambar ? 'inline' : 'attachment'}; filename="${namaAman(row.nama)}"`,
			'cache-control': 'public, max-age=31536000, immutable',
			'x-content-type-options': 'nosniff'
		}
	});
};
